
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

  const machines = useMemo(() => {
    const counts = {};

    merged.forEach((item) => {
      item.machines.split(", ").forEach((machine) => {
        counts[machine] = (counts[machine] || 0) + 1;
      });
    });

    const list = Object.keys(counts)
      .sort()
      .map((name) => ({
        name,
        count: counts[name],
      }));

    return [{ name: "Tümü", count: merged.length }, ...list];
  }, [merged]);

  const filtered = useMemo(() => {
    let data = [...merged];

    if (category === "Hammadde")
      data = data.filter((x) => x.type === "Hammadde");

    if (category === "Silikon")
      data = data.filter((x) => x.type === "Silikon");

    if (selectedMachine !== "Tümü") {
      data = data.filter((x) =>
        x.machines.split(", ").includes(selectedMachine)
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

    return data;
  }, [merged, category, search, selectedMachine]);

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
          <small>3 Günlük Malzeme</small>
          <h2>{filtered.length}</h2>
        </div>

        <div className="card">
          <small>Depoya Gönder</small>
          <h2>{filtered.filter((x) => x.action === "Depoya Gönder").length}</h2>
        </div>

        <div className="card">
          <small>Kritik</small>
          <h2>{filtered.filter((x) => x.action === "Kritik").length}</h2>
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