const format = (v, d = 2) =>
  Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: d });

const formatDate = (d) =>
  d ? d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";

const STATUS_CLASS = {
  "Yeterli": "statusButton green",
  "Eksik": "statusButton amber",
  "Uygun parti yok": "statusButton red",
  "Stokta yok": "statusButton gray",
};

export default function SummaryTable({ data }) {
  if (!data.length) {
    return <div className="stockTable emptyTable">Seçilen sürede ihtiyaç yok.</div>;
  }

  return (
    <div className="stockTable">
      <table>
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>Tip</th>
            <th className="num">TopDlmEni</th>
            <th>İlk Başlangıç</th>
            <th>Hatlar</th>
            <th className="num">İş Emri</th>
            <th className="num">Pl. Kalan (m²)</th>
            <th className="num">Uygun Stok (m²)</th>
            <th className="num">Karşılanan (m²)</th>
            <th className="num">Eksik (m²)</th>
            <th>Durum</th>
          </tr>
        </thead>

        <tbody>
          {data.map((r) => (
            <tr key={`${r.material}-${r.dilmeEni}`}>
              <td>
                <div className="materialCode">{r.material}</div>
                <div className="materialName">{r.name}</div>
              </td>
              <td>{r.type}</td>
              <td className="num">{format(r.dilmeEni, 1)}</td>
              <td>{formatDate(r.firstStart)}</td>
              <td>{r.machines}</td>
              <td className="num">{r.jobCount}</td>
              <td className="num">{format(r.need)}</td>
              <td className="num">
                {format(r.fittingStock)}
                <div className="muted">{r.fittingCount} parti</div>
              </td>
              <td className="num">{format(r.covered)}</td>
              <td className={r.missing > 0 ? "num redText" : "num"}>
                {r.missing > 0 ? format(r.missing) : "-"}
              </td>
              <td>
                <span className={STATUS_CLASS[r.status]}>{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
