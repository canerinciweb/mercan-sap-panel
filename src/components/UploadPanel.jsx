function UploadBox({ label, info, onFile }) {
  return (
    <div className="uploadBox">
      <label className="uploadButton">
        📁 {label}
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => {
            onFile(e.target.files[0]);
            e.target.value = ""; // aynı dosya tekrar seçilebilsin
          }}
        />
      </label>

      <div className="fileName">{info?.name || `${label} seçilmedi`}</div>
      {info && <div className="fileStats">{info.summary}</div>}
    </div>
  );
}

export default function UploadPanel({ zpp, zparti, onZpp, onZparti }) {
  return (
    <div className="uploadPanel">
      <UploadBox
        label="ZPP022"
        onFile={onZpp}
        info={zpp && { name: zpp.fileName, summary: `${zpp.total} satır, ${zpp.items.length} U/A/F/G kalemi` }}
      />
      <UploadBox
        label="ZPARTİ"
        onFile={onZparti}
        info={zparti && { name: zparti.fileName, summary: `${zparti.items.length} parti` }}
      />
    </div>
  );
}
