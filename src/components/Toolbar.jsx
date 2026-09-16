export default function Toolbar({
  category,
  setCategory,
  search,
  setSearch,
  onExport,
  summaryMode,
  setSummaryMode,
}) {
  return (
    <div className="toolbar">
      <div className="filters">
        {["Her İkisi", "Hammadde", "Diger"].map((item) => (
          <button
            key={item}
            className={
              category === item ? "filterButton active" : "filterButton"
            }
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="toolbarRight">
        <input
          className="searchInput"
          placeholder="Kod, malzeme veya hat ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className={summaryMode ? "filterButton active" : "filterButton"}
          onClick={() => setSummaryMode(!summaryMode)}
        >
          {summaryMode ? "Detay" : "ÖZET"}
        </button>

        <button className="exportButton" onClick={onExport}>
          📊 Excel
        </button>
      </div>
    </div>
  );
}