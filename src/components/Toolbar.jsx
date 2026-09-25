import { KALEM_TIPLERI } from "../utils/parser";

const CATEGORIES = ["Tümü", ...Object.values(KALEM_TIPLERI)];
const QUICK_DAYS = [1, 2, 3, 5, 7];

export default function Toolbar({
  category, setCategory,
  days, setDays,
  search, setSearch,
  view, setView,
  onExport,
}) {
  return (
    <div className="toolbar">
      <div className="filters">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            className={category === item ? "filterButton active" : "filterButton"}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="filters">
        {QUICK_DAYS.map((d) => (
          <button
            key={d}
            className={days === d ? "filterButton small active" : "filterButton small"}
            onClick={() => setDays(d)}
          >
            {d} gün
          </button>
        ))}

        <label className="dayInput">
          <input
            type="number"
            min="1"
            max="60"
            value={days}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n)) setDays(Math.min(60, Math.max(1, n)));
            }}
          />
          gün
        </label>
      </div>

      <div className="toolbarRight">
        <input
          className="searchInput"
          placeholder="Malzeme, parti, depo veya hat ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className={view === "ihtiyac" ? "filterButton active" : "filterButton"}
          onClick={() => setView(view === "ihtiyac" ? "parti" : "ihtiyac")}
        >
          {view === "ihtiyac" ? "Parti Listesi" : "İhtiyaç Özeti"}
        </button>

        <button className="exportButton" onClick={onExport}>
          📊 Excel
        </button>
      </div>
    </div>
  );
}
