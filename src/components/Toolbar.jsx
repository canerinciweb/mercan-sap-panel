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

        <button type="button" className="exportButton" onClick={onExport}>
          <svg
            className="excelIcon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" fill="white"/>
            <rect x="6" y="7" width="3" height="10" fill="#107C41"/>
            <rect x="11" y="10" width="3" height="7" fill="#21A366"/>
            <rect x="16" y="5" width="3" height="12" fill="#33C481"/>
          </svg>

          Excel İndir
        </button>
      </div>
    </div>
  );
}