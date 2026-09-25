export default function Toolbar({
  category, setCategory, search, setSearch, onExport,
  summaryMode, setSummaryMode, days, setDays,
}) {
  return (
    <div className="toolbar">
      <div className="filters">
        {["Tümü", "Üst Kağıt", "Alt Kağıt", "Y.M. Üst", "Y.M. Alt"].map((item) => (
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
        {[1, 2, 3, 5, 7].map((d) => (
          <button
            key={d}
            className={days === d ? "filterButton active" : "filterButton"}
            style={{ minWidth: 50 }}
            onClick={() => setDays(d)}
          >
            {d} gün
          </button>
        ))}
        <input
          className="searchInput"
          style={{ width: 70 }}
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>

      <div className="toolbarRight">
        <input
          className="searchInput"
          placeholder="Malzeme, parti, depo yeri veya hat ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className={summaryMode ? "filterButton active" : "filterButton"}
          onClick={() => setSummaryMode(!summaryMode)}
        >
          {summaryMode ? "Detay" : "ÖZET"}
        </button>
        <button className="exportButton" onClick={onExport}>📊 Excel</button>
      </div>
    </div>
  );
}