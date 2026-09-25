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
      data = data.filter((x) => x.type.includes(category));
    }

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
          startDate: item.startDate,
          usable: 0,
          need: item.need, // malzemenin toplam ihtiyacı, toplanmaz
          depotArea: 0,
          partiCount: 0,
          hasCritical: false,
          jobs: new Set(),
        };
      }

      const m = map[item.material];

      m.usable += Number(item.usable || 0);
      if (item.parti && item.parti !== "-") m.partiCount++;
      if (item.action === "Depoya Gönder") m.depotArea += Number(item.usable || 0);
      if (item.action === "Kritik") m.hasCritical = true;

      if (item.startDate && (!m.startDate ||