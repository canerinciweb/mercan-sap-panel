import { useMemo, useState } from "react";
import "./App.css";
import { exportStockExcel } from "./utils/exportExcel";

import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import UploadPanel from "./components/UploadPanel";
import StockTable from "./components/StockTable";
import MachinePanel from "./components/MachinePanel";
import SummaryTable from "./components/SummaryTable";

import { readExcel } from "./utils/excel";
import { parseZparti, parseZpp } from "./utils/parser";
import { mergeData } from "./utils/calculate";

export default function App() {
  const [category, setCategory] = useState("Tümü");
const [days, setDays] = useState(3);
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
    critical: false,
  });

  /* ===========================
     ZPARTİ YÜKLE
  =========================== */

  async function handleZparti(file) {
    if (!file) return;

    const rows = await readExcel(file);

    // 441507502 satırını kontrol ediyoruz
    const merged = useMemo(() => mergeData(zparti, zpp, days), [zparti, zpp, days]);
        console.log("========== ZPARTİ TEST ==========");
    console.log("Satır:", test);
    console.log("Uzunluk:", test?.["Uzunluk"]);
    console.log("Tip:", typeof test?.["Uzunluk"]);
    console.log("=================================");

    setZparti(parseZparti(rows));
    setZpartiName(file.name);
  }

  /* ===========================
     ZPP YÜKLE
  =========================== */

  async function handleZpp(file) {
    if (!file) return;

    const rows = await readExcel(file);
    setZpp(parseZpp(rows));
    setZppName(file.name);
  }

  const merged = useMemo(() => mergeData(zparti, zpp), [zparti, zpp]);

  /* ===========================
     Hat filtresi öncesi
  =========================== */

  const filteredBase = useMemo(() => {
    let data = [...merged];

    if (category !== "Tümü") data = data.filter((x) => x.type.includes(category));

if (search.trim()) {
  const q = search.toLocaleLowerCase("tr");
  data = data.filter((x) =>
    [x.material, x.name, x.parti, x.depo, x.machines].some((v) =>
      String(v || "").toLocaleLowerCase("tr").includes(q)
    )
  );
}

    const active = [];

    if (cardFilter.depot) active.push("Depoya Gönder");
    if (cardFilter.critical) active.push("Kritik");

    if (active.length)
      data = data.filter((x) => active.includes(x.action));

    return data;
  }, [merged, category, search, cardFilter]);

  /* ===========================
     Hat listesi
  =========================== */

  const machines = useMemo(() => {
    const counts = {};

    filteredBase.forEach((item) => {
      (item.machines || "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
        .forEach((machine) => {
          counts[machine] = (counts[machine] || 0) + 1;
        });
    });

    return [
      { name: "Tümü", count: filteredBase.length },
      ...Object.keys(counts)
        .sort((a, b) => a.localeCompare(b, "tr"))
        .map((name) => ({
          name,
          count: counts[name],
        })),
    ];
  }, [filteredBase]);

  /* ===========================
     Hat filtresi
  =========================== */

  const filtered = useMemo(() => {
    if (selectedMachine === "Tümü") return filteredBase;

    return filteredBase.filter((x) =>
      (x.machines || "")
        .split(",")
        .map((m) => m.trim())
        .includes(selectedMachine)
    );
  }, [filteredBase, selectedMachine]);

  /* ===========================
     Özet
  =========================== */

  const summaryData = useMemo(() => {
    const map = {};

    filtered.forEach((item) => {
      if (!map[item.material]) {
  map[item.material] = {
    material: item.material, name: item.name, type: item.type,
    startDate: item.startDate, usable: 0, need: item.need, jobs: new Set(),
  };
}
map[item.material].usable += item.usable;

            String(item.jobOrders || "")
        .split(/\n|,/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((o) => map[item.material].jobs.add(o));
    });

    return Object.values(map)
      .map((x) => {
        const result = x.usable - x.need;

        return {
          ...x,
          jobCount: x.jobs.size,
          result,
          action:
            x.need === 0
              ? "Depoya Gönder"
              : result < 0
              ? "Kritik"
              : result > 0
              ? "Depoya Gönder"
              : "Kullanılacak",
        };
      })
      .sort((a, b) => a.material.localeCompare(b.material));
  }, [filtered]);

  return (
    <div className="app">
      <Header />

      <Toolbar
        category={category}
        setCategory={setCategory}
        search={search}
        setSearch={setSearch}
        onExport={() => exportStockExcel(filtered)}
        summaryMode={summaryMode}
        setSummaryMode={setSummaryMode}
        days={days}
  setDays={setDays}
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
            <span>{days} Günlük Malzeme</span>
          </label>
          <h2>{merged.length}</h2>
        </div>

        <div className="card">
          <label className="cardTitle">
            <input
              type="checkbox"
              checked={cardFilter.depot}
              onChange={(e) =>
                setCardFilter((prev) => ({
                  ...prev,
                  depot: e.target.checked,
                  threeDay: e.target.checked ? false : prev.threeDay,
                }))
              }
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
              onChange={(e) =>
                setCardFilter((prev) => ({
                  ...prev,
                  critical: e.target.checked,
                  threeDay: e.target.checked ? false : prev.threeDay,
                }))
              }
            />
            <span>Kritik</span>
          </label>
          <h2>{merged.filter((x) => x.action === "Kritik").length}</h2>
        </div>
      </div>

      <div className={summaryMode ? "mainLayout single" : "mainLayout"}>

        {summaryMode ? (
          <SummaryTable data={summaryData} />
        ) : (
          <StockTable data={filtered} />
        )}
      </div>
    </div>
  );
}