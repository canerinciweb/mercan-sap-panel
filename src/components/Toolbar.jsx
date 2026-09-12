export default function Toolbar({
  category,
  setCategory,
  search,
  setSearch,
}) {
  const buttons = ["Her İkisi", "Hammadde", "Silikon"];

  return (
    <div className="toolbar">
      <div className="filters">
        {buttons.map((item) => (
          <button
            key={item}
            className={
              category === item
                ? "filterButton active"
                : "filterButton"
            }
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <input
        className="searchInput"
        type="text"
        placeholder="Kod, malzeme veya hat ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}