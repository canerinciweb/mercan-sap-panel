import { useMemo, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import UploadPanel from "./components/UploadPanel";
import MachinePanel from "./components/MachinePanel";
import StockTable from "./components/StockTable";
import SummaryTable from "./components/SummaryTable";

import { readExcel } from "./utils/excel";
import { parseZpp, parseZparti } from "./utils/parser";
import { buildReport, DURUM, TOL_ALT, TOL_UST } from "./utils/calculate";
import { exportPartiExcel, exportIhtiyacExcel } from "./utils/exportExcel";

const splitList = (text) =>
  String(text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: 0 });
const fmtDate = (d) =>
  d ? d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";

const CARDS = [
  { key: DURUM.DEPO, hint: "Seçilen sürede malzemenin hiç ihtiyacı yok" },
  { key: DURUM.KULLANILMAYACAK, hint: "İhtiyaç var ama bu parti kullanılmıyor" },
  { key: DURUM.KULLANILACAK, hint: "Seçilen sürede tüketilecek" },
];

export default function App() {
  /* ===========================
     STATE
  =========================== */

  const [zpp, setZpp] = useState(null);
  const [zparti, setZparti] = useState(null);
  const [error, setError] = useState("");

  const [days, setDays] = useState(3);
  const [category, setCategory] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("Tümü");
  const [view, setView] = useState("parti");

  const [statusFilter, setStatusFilter] = useState({
    [DURUM.DEPO]: true,
    [DURUM.KULLANILMAYACAK]: true,
    [DURUM.KULLANILACAK]: true,
  });

  /* ===========================
     DOSYA YÜKLEME
  =========================== */

  async function load(file, kind) {
    if (!file) return;
    setError("");

    try {
      const sheet = await readExcel(file);

      if (kind === "zpp") setZpp({ ...parseZpp(sheet), fileName: file.name });
      else setZparti({ ...parseZparti(sheet), fileName: file.name });
    } catch (e) {
      console.error(e);
      setError(`${file.name} okunamadı: ${e.message}`);
    }
  }

  /* ===========================
     HESAP
     refDate her gün değişiminde yenilenir (şimdi)
  =========================== */

  const report = useMemo(() => {
    if (!zpp) return null;
    return buildReport(zparti?.items || [], zpp.items, days, new Date());
  }, [zpp, zparti, days]);

  /* ===========================
     FİLTRELER
  =========================== */

  const q = search.trim().toLocaleLowerCase("tr");

  const matches = (r) =>
    (category === "Tümü" || r.types.includes(category)) &&
    (!q ||
      [r.material, r.name, r.parti, r.depo, r.machines].some((v) =>
        String(v || "").toLocaleLowerCase("tr").includes(q)
      ));

  /* Kategori + arama (kart sayıları buna göre) */
  const baseParti = useMemo(
    () => (report ? report.partiRows.filter(matches) : []),
    [report, category, q] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const baseNeed = useMemo(
    () => (report ? report.needRows.filter(matches) : []),
    [report, category, q] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /* + durum filtresi */
  const statusParti = useMemo(
    () => baseParti.filter((r) => statusFilter[r.status]),
    [baseParti, statusFilter]
  );

  /* Hat listesi */
  const machines = useMemo(() => {
    const source = view === "parti" ? statusParti : baseNeed;
    const counts = {};

    source.forEach((r) =>
      splitList(r.machines).forEach((m) => (counts[m] = (counts[m] || 0) + 1))
    );

    return [
      { name: "Tümü", count: source.length },
      ...Object.keys(counts)
        .sort((a, b) => a.localeCompare(b, "tr", { numeric: true }))
        .map((name) => ({ name, count: counts[name] })),
    ];
  }, [view, statusParti, baseNeed]);

  const activeMachine = machines.some((m) => m.name === selectedMachine)
    ? selectedMachine
    : "Tümü";

  const byMachine = (r) =>
    activeMachine === "Tümü" || splitList(r.machines).includes(activeMachine);

  const partiRows = useMemo(() => statusParti.filter(byMachine), [statusParti, activeMachine]); // eslint-disable-line react-hooks/exhaustive-deps
  const needRows = useMemo(() => baseNeed.filter(byMachine), [baseNeed, activeMachine]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Kart sayıları */
  const stats = useMemo(() => {
    const s = {};
    CARDS.forEach((c) => (s[c.key] = { count: 0, area: 0 }));
    baseParti.forEach((r) => {
      s[r.status].count++;
      s[r.status].area += r.status === DURUM.KULLANILACAK ? r.used : r.miktar;
    });
    return s;
  }, [baseParti]);

  /* ===========================
     EXCEL
  =========================== */

  function handleExport() {
    if (!report) return;

    const meta = {
      days,
      refDate: new Date(report.windowEnd.getTime() - days * 86400000),
      windowEnd: report.windowEnd,
      tolAlt: TOL_ALT,
      tolUst: TOL_UST,
    };

    if (view === "ihtiyac") exportIhtiyacExcel(needRows, meta);
    else exportPartiExcel(partiRows, meta);
  }

  /* ===========================
     EKRAN
  =========================== */

  const warnings = [...(zpp?.warnings || []), ...(zparti?.warnings || [])];

  return (
    <div className="app">
      <Header />

      <Toolbar
        category={category}
        setCategory={setCategory}
        days={days}
        setDays={setDays}
        search={search}
        setSearch={setSearch}
        view={view}
        setView={setView}
        onExport={handleExport}
      />

      <UploadPanel
        zpp={zpp}
        zparti={zparti}
        onZpp={(f) => load(f, "zpp")}
        onZparti={(f) => load(f, "zparti")}
      />

      {error && <div className="messageBox error">{error}</div>}

      {warnings.map((w) => (
        <div key={w} className="messageBox warn">{w}</div>
      ))}

      {!report ? (
        <div className="messageBox info">
          ZPP022 ve ZPARTİ dosyalarını yükle. Seçilen gün içinde kullanılmayacak üst ve alt
          kağıt partileri burada listelenecek.
        </div>
      ) : (
        <>
          <div className="windowInfo">
            {fmtDate(new Date(report.windowEnd.getTime() - days * 86400000))} –{" "}
            {fmtDate(report.windowEnd)} arasında başlayan ve geciken işler ihtiyaç sayıldı. En
            toleransı: TopDlmEni −{TOL_ALT} cm / +{TOL_UST} cm.
            {!zparti && <strong> ZPARTİ yüklenmedi, parti listesi boş.</strong>}
            {report.noDate > 0 && (
              <strong> {report.noDate} satırda plan başlangıç tarihi okunamadı.</strong>
            )}
          </div>

          <div className="cards">
            {CARDS.map((c) => (
              <div key={c.key} className="card">
                <label className="cardTitle">
                  <input
                    type="checkbox"
                    checked={statusFilter[c.key]}
                    onChange={(e) =>
                      setStatusFilter((prev) => ({ ...prev, [c.key]: e.target.checked }))
                    }
                  />
                  <span>{c.key}</span>
                </label>
                <h2>{stats[c.key].count}</h2>
                <div className="cardArea">{fmt(stats[c.key].area)} m²</div>
                <div className="cardHint">{c.hint}</div>
              </div>
            ))}
          </div>

          <div className="mainLayout">
            <MachinePanel
              machines={machines}
              selectedMachine={activeMachine}
              setSelectedMachine={setSelectedMachine}
            />

            {view === "ihtiyac" ? (
              <SummaryTable data={needRows} />
            ) : (
              <StockTable data={partiRows} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
