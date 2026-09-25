import { useMemo, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import UploadPanel from "./components/UploadPanel";
import StockTable from "./components/StockTable";
import MachinePanel from "./components/MachinePanel";
import SummaryTable from "./components/SummaryTable";

import { readExcel } from "./utils/excel";
import { parseZparti, parseZpp } from "./utils/parser";
import { mergeData } from "./utils/calculate";
import { exportStockExcel } from "./utils/exportExcel";

const splitList = (text) =>
  String(text || "")
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter((x) => x && x !== "-");

export default function App() {
  /* ===========================
     STATE
  =========================== */

  const [category, setCategory] = useState("Tümü");
  const [days, setDays] = useState(3);
  const [search, setSearch] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("Tümü");
  const [summaryMode, setSummaryMode] = useState(false);

  const [zparti, setZparti] = useState([]);
  const [zpp, setZpp] = useState([]);

  const [zpartiName, setZpartiName] = useState("");
  const [zppName, setZppName] = useState("");
  const [error, setError] = useState("");

  const [cardFilter, setCardFilter] = useState({
    all: true,
    depot: false,
    critical: false,
  });

  /* ===========================
     DOSYA YÜKLEME
  =========================== */

  async function handleZparti(file) {
    if (!file) return;
    setError("");

    try {
      const rows = await readExcel(file);
      setZparti(parseZparti(rows));
      setZpartiName(file.name);
    } catch (e) {
      console.error(e);
      setError(`ZPARTİ okunamadı: ${e.message}`);
    }
  }

  async function handleZpp(file) {
    if (!file) return;
    setError("");

    try {
      const rows = await readExcel(file);
      setZpp(parseZpp(rows));
      setZppName(file.name);
    } catch (e) {
      console.error(e);
      setError(`ZPP022 okunamadı: ${e.message}`);
    }
  }

  /* ===========================
     HESAP
  =========================== */

  const merged = useMemo(() => mergeData(zparti, zpp, days), [zparti, zpp, days]);

  /* ===========================
     KATEGORİ + ARAMA + KART FİLTRESİ
  =========================== */

  const filteredBase = useMemo(() => {
    let data = merged;

    if (category !== "Tümü") {
      data = data.filter((x) => String(x.type || "").includes(category));
    }

    if (search.trim()) {
      const q = search.trim().toLocaleLowerCase("tr");

      data = data.filter((x) =>
        [x.material, x.name, x.parti, x.depo, x.machines].some((v) =>
          String(v || "").toLocaleLowerCase("tr").includes(q)
        )
      );
    }

    const active = [];
    if (cardFilter.depot) active.push("Depoya Gönder");
    if (cardFilter.critical) active.push("Kritik");

    if (active.length) {
      data = data.filter((x) => active.includes(x.action));
    }

    return data;
  }, [merged, category, search, cardFilter]);

  /* ===========================
     HAT LİSTESİ
  =========================== */

  const machines = useMemo(() => {
    const counts = {};

    filteredBase.forEach((item) => {
      splitList(item.machines).forEach((machine) => {
        counts[machine] = (counts[machine] || 0) + 1;
      });
    });

    return [
      { name: "Tümü", count: filteredBase.length },
      ...Object.keys(counts)
        .sort((a, b) => a.localeCompare(b, "tr"))
        .map((name) => ({ name, count: counts[name] })),
    ];
  }, [filteredBase]);

  /* Seçili hat listeden düştüyse "Tümü"ne dön */
  const activeMachine = machines.some((m) => m.name === selectedMachine)
    ? selectedMachine
    : "Tümü";

  /* ===========================
     HAT FİLTRESİ
  =========================== */

  const filtered = useMemo(() => {
    if (activeMachine === "Tümü") return filteredBase;

    return filteredBase.filter((x) => splitList(x.machines).includes(activeMachine));
  }, [filteredBase, activeMachine]);

  /* ===========================
     ÖZET (malzeme bazında)
  =========================== */

  const summaryData = useMemo(() => {
    const map = {};

    filtered.forEach((item) => {
      if (!map[item.material]) {
        map[item.material] = {
          material: item.material,
          name: item.name,
          type: item.type,
          startDate: null,
          usable: 0,
          need: Number(item.need || 0), // malzemenin toplam ihtiyacı, toplanmaz
          depotArea: 0,
          partiCount: 0,
          hasCritical: false,
          allDepot: true,
          jobs: new Set(),
        };
      }

      const m = map[item.material];

      m.usable += Number(item.usable || 0);

      if (item.parti && item.parti !== "-") m.partiCount++;
      if (item.action === "Depoya Gönder") m.depotArea += Number(item.usable || 0);
      if (item.action === "Kritik") m.hasCritical = true;
      if (item.action !== "Depoya Gönder") m.allDepot = false;

      if (item.startDate && (!m.startDate || item.startDate < m.startDate)) {
        m.startDate = item.startDate;
      }

      splitList(item.jobOrders).forEach((o) => m.jobs.add(o));
    });

    return Object.values(map)
      .map((x) => ({
        ...x,
        jobCount: x.jobs.size,
        result: x.usable - x.need,
        action: x.hasCritical
          ? "Kritik"
          : x.allDepot || x.need <= 0
          ? "Depoya Gönder"
          : "Kullanılacak",
      }))
      .sort((a, b) => a.material.localeCompare(b.material, "tr", { numeric: true }));
  }, [filtered]);

  /* ===========================
     KART SAYILARI
  =========================== */

  const depotCount = merged.filter((x) => x.action === "Depoya Gönder").length;
  const criticalCount = merged.filter((x) => x.action === "Kritik").length;

  function toggleAll(checked) {
    if (checked) setCardFilter({ all: true, depot: false, critical: false });
  }

  function toggleCard(key, checked) {
    setCardFilter((prev) => {
      const next = { ...prev, [key]: checked };
      next.all = !next.depot && !next.critical;
      return next;
    });
  }

  /* ===========================
     EKRAN
  =========================== */

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

      {error && <div className="errorBox">{error}</div>}

      <div className="cards">
        <div className="card">
          <label className="cardTitle">
            <input
              type="checkbox"
              checked={cardFilter.all}
              onChange={(e) => toggleAll(e.target.checked)}
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
              onChange={(e) => toggleCard("depot", e.target.checked)}
            />
            <span>Depoya Gönder</span>
          </label>
          <h2>{depotCount}</h2>
        </div>

        <div className="card">
          <label className="cardTitle">
            <input
              type="checkbox"
              checked={cardFilter.critical}
              onChange={(e) => toggleCard("critical", e.target.checked)}
            />
            <span>Kritik</span>
          </label>
          <h2>{criticalCount}</h2>
        </div>
      </div>

      <div className={summaryMode ? "mainLayout single" : "mainLayout"}>
        {!summaryMode && (
          <MachinePanel
            machines={machines}
            selectedMachine={activeMachine}
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
