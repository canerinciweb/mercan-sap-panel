export default function Toolbar({
  category,
  setCategory,
  search,
  setSearch,
  onExport,
}) {
  return (
    <div className="toolbar">
      <div className="filters">
        {["Her İkisi", "Hammadde", "Silikon"].map((item) => (
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

        <button className="exportButton" onClick={onExport}>
  <span className="excelIcon">📊</span>
  <span>Excel İndir</span>
</button>
      </div>
    </div>
  );
}