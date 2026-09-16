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
    critical: false,
  });

  /* ===========================
     ZPARTİ YÜKLE
  =========================== */

  async function handleZparti(file) {
    if (!file) return;

    const rows = await readExcel(file);

    // 441507502 satırını kontrol ediyoruz
    const test = rows.find(
      (r) => String(r["Malzeme"]).trim() === "441507502"
    );

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

    if (category === "Hammadde")
      data = data.filter((x) => x.type === "Hammadde");

    if (category === "Silikon")
      data = data.filter((x) => x.type === "Silikon");

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter(
        (x) =>
          x.material.toLowerCase().includes(q) ||
          x.name.toLowerCase().includes(q)
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
          material: item.material,
          name: item.name,
          type: item.type,
          usable: Number(item.usable || item.stock) || 0,
          need: 0,
          jobs: new Set(),
        };
      }

      map[item.material].need += Number(item.need || 0);

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
            <span>3 Günlük Malzeme</span>
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

      <div className="mainLayout">
        {!summaryMode && (
          <MachinePanel
            machines={machines}
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
          />
        )}

        {summaryMode ? (
          <SummaryTable data={summaryData} />
        ) : (
          <StockTable data={filtered} />
        )}
      </div>
    </div>
  );
}