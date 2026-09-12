import { useMemo, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import UploadPanel from "./components/UploadPanel";
import StockTable from "./components/StockTable";
import MachinePanel from "./components/MachinePanel";

import { readExcel } from "./utils/excel";
import { parseZparti, parseZpp } from "./utils/parser";
import { mergeData } from "./utils/calculate";

export default function App() {
  const [category, setCategory] = useState("Her İkisi");
  const [search, setSearch] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("Tümü");

  const [zparti, setZparti] = useState([]);
  const [zpp, setZpp] = useState([]);

  const [zpartiName, setZpartiName] = useState("");
  const [zppName, setZppName] = useState("");
  const [cardFilter, setCardFilter] = useState({
  threeDay: true,
  depot: false,
  critical: false,});

  async function handleZparti(file) {
    if (!file) return;
    setZparti(parseZparti(await readExcel(file)));
    setZpartiName(file.name);
  }

  async function handleZpp(file) {
    if (!file) return;
    setZpp(parseZpp(await readExcel(file)));
    setZppName(file.name);
  }

  const merged = useMemo(() => mergeData(zparti, zpp), [zparti, zpp]);

  // Hat listesini ZPP'den oluştur
  const machines = useMemo(() => {
    const counts = {};

    zpp.forEach((row) => {
      const machine = (row.machine || "").trim();

      if (!machine) return;

      counts[machine] = (counts[machine] || 0) + 1;
    });

    const list = Object.keys(counts)
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((name) => ({
        name,
        count: counts[name],
      }));

    return [{ name: "Tümü", count: merged.length }, ...list];
  }, [zpp, merged]);

  const filtered = useMemo(() => {
  let data = [...merged];

  if (category === "Hammadde")
    data = data.filter((x) => x.type === "Hammadde");

  if (category === "Silikon")
    data = data.filter((x) => x.type === "Silikon");

  if (selectedMachine !== "Tümü") {
    data = data.filter((x) =>
      x.machines.split(", ").map((m) => m.trim()).includes(selectedMachine)
    );
  }

  if (search.trim()) {
    const q = search.toLowerCase();

    data = data.filter(
      (x) =>
        x.material.toLowerCase().includes(q) ||
        x.name.toLowerCase().includes(q)
    );
  }

  const activeFilters = [];

  if (cardFilter.depot) activeFilters.push("Depoya Gönder");
  if (cardFilter.critical) activeFilters.push("Kritik");

  if (activeFilters.length) {
    data = data.filter((x) => activeFilters.includes(x.action));
  }

  return data;
}, [
  merged,
  category,
  search,
  selectedMachine,
  cardFilter,
]);

  return (
    <div className="app">
      <Header />

      <Toolbar
        category={category}
        setCategory={setCategory}
        search={search}
        setSearch={setSearch}
      />

      <UploadPanel
        handleZparti={handleZparti}
        handleZpp={handleZpp}
        zpartiName={zpartiName}
        zppName={zppName}
      />

      <div className="cards">

  <div className="card">
    <label className="cardTitle">
      <checkbox
        checked={cardFilter.threeDay}
        onChange={(checked) =>
          setCardFilter((prev) => ({
            ...prev,
            threeDay: checked,
            depot: checked ? false : prev.depot,
            critical: checked ? false : prev.critical,
          }))
        }
      />
      <span>3 Günlük Malzeme</span>
    </label>

    <h2>{merged.length}</h2>
  </div>

  <div className="card">
    <label className="cardTitle">
      <checkbox
        checked={cardFilter.depot}
        onChange={(checked) =>
          setCardFilter((prev) => ({
            ...prev,
            depot: checked,
            threeDay: checked ? false : prev.threeDay,
          }))
        }
      />
      <span>Depoya Gönder</span>
    </label>

    <h2>{merged.filter((x) => x.action === "Depoya Gönder").length}</h2>
  </div>

  <div className="card">
    <label className="cardTitle">
      <checkbox
        checked={cardFilter.critical}
        onChange={(checked) =>
          setCardFilter((prev) => ({
            ...prev,
            critical: checked,
            threeDay: checked ? false : prev.threeDay,
          }))
        }
      />
      <span>Kritik</span>
    </label>

    <h2>{merged.filter((x) => x.action === "Kritik").length}</h2>
  </div>

</div>

      <div className="mainLayout">
        <MachinePanel
          machines={machines}
          selectedMachine={selectedMachine}
          setSelectedMachine={setSelectedMachine}
        />

        <StockTable data={filtered} />
      </div>
    </div>
  );
}