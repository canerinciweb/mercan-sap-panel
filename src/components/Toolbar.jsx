export default function Toolbar({
  category,
  setCategory,
  search,
  setSearch,
}) {
  const tabs = ["Her İkisi", "Hammadde", "Silikon"];

  return (
    <div className="toolbar">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={category === tab ? "active" : ""}
            onClick={() => setCategory(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <input
        className="search"
        placeholder="Kod, malzeme veya hat ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}