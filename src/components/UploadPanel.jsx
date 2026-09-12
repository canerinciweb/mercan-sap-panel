export default function UploadPanel({
  handleZparti,
  handleZpp,
  zpartiName,
  zppName,
}) {
  return (
    <div className="uploadPanel">
      <div className="uploadBox">
        <label className="uploadButton">
          📁 ZPARTI
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => handleZparti(e.target.files[0])}
          />
        </label>

        <div className="fileName">
          {zpartiName || "ZPARTI seçilmedi"}
        </div>
      </div>

      <div className="uploadBox">
        <label className="uploadButton">
          📁 ZPPSTOK
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => handleZpp(e.target.files[0])}
          />
        </label>

        <div className="fileName">
          {zppName || "ZPPSTOK seçilmedi"}
        </div>
      </div>
    </div>
  );
}