import { useMemo, useState } from "react";
import "./App.css";
import { exportStockExcel } from "./utils/exportExcel";
import SummaryTable from "./components/SummaryTable";
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
const [summaryMode, setSummaryMode] = useState(false);
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
  const summaryData = useMemo(() => {
  const map = {};

  filtered.forEach((item) => {
    const key = item.material;

    if (!map[key]) {
      map[key] = {
        material: item.material,
        name: item.name,
        type: item.type,
        stock: Number(item.stock) || 0,
        need: 0,
        jobCount: 0,
      };
    }

    map[key].need += Number(item.need) || 0;

    if (Array.isArray(item.jobOrders)) {
      map[key].jobCount += item.jobOrders.length;
    } else if (typeof item.jobOrders === "string") {
      map[key].jobCount += item.jobOrders
        .split("\n")
        .filter(Boolean).length;
    } else {
      map[key].jobCount += 1;
    }
  });

  return Object.values(map)
    .map((x) => ({
      ...x,
      result: x.stock - x.need,
    }))
    .sort((a, b) => a.material.localeCompare(b.material));
}, [filtered]);

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
  onExport={() => exportStockExcel(filtered)}
/>
<div style={{ padding: "0 18px 18px" }}>
  <button
    className={summaryMode ? "summaryButton active" : "summaryButton"}
    onClick={() => setSummaryMode(!summaryMode)}
  >
    {summaryMode ? "Detay Görünüm" : "Özet"}
  </button>
</div>
      <UploadPanel
        handleZparti={handleZparti}
        handleZpp={handleZpp}
        zpartiName={zpartiName}
        zppName={zppName}
      />

      <div className="cards">
  <div className="card">
    <label className="cardTitle">
      <input
        type="checkbox"
        checked={cardFilter.threeDay}
        onChange={(e) =>
          setCardFilter((prev) => ({
            ...prev,
            threeDay: e.target.checked,
            depot: e.target.checked ? false : prev.depot,
            critical: e.target.checked ? false : prev.critical,
          }))
        }
      />
      <span>3 Günlük Malzeme</span>
    </label>

    <h2>{merged.length}</h2>
  </div>

  <div className="card">
    <label className="cardTitle">
      <input
  type="checkbox"
  checked={cardFilter.depot}
  onChange={(e) => {
    setCardFilter((prev) => ({
      ...prev,
      depot: e.target.checked,
      threeDay: e.target.checked ? false : prev.threeDay,
    }));
  }}
/>
      <span>Depoya Gönder</span>
    </label>

    <h2>{merged.filter((x) => x.action === "Depoya Gönder").length}</h2>
  </div>

  <div className="card">
    <label className="cardTitle">
      <input
  type="checkbox"
  checked={cardFilter.critical}
  onChange={(e) => {
    setCardFilter((prev) => ({
      ...prev,
      critical: e.target.checked,
      threeDay: e.target.checked ? false : prev.threeDay,
    }));
  }}
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

        {summaryMode ? (
  <SummaryTable data={summaryData} />
) : (
  <StockTable data={filtered} />
)}
      </div>
    </div>
  );
}