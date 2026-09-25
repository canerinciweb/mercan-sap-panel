import { DURUM } from "../utils/calculate";

const format = (v, d = 2) =>
  Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: d });

const STATUS_CLASS = {
  [DURUM.DEPO]: "statusButton blue",
  [DURUM.KULLANILMAYACAK]: "statusButton red",
  [DURUM.KULLANILACAK]: "statusButton green",
};

export default function StockTable({ data }) {
  if (!data.length) {
    return <div className="stockTable emptyTable">Bu filtrelerle eşleşen parti yok.</div>;
  }

  return (
    <div className="stockTable">
      <table>
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>Tip</th>
            <th>Parti</th>
            <th>Depo Yeri</th>
            <th>Stok Tipi</th>
            <th className="num">En (cm)</th>
            <th className="num">TopDlmEni</th>
            <th className="num">Uzunluk (m)</th>
            <th className="num">Kullanılabilir (m²)</th>
            <th className="num">Kullanılacak (m²)</th>
            <th>Durum</th>
            <th>Açıklama</th>
          </tr>
        </thead>

        <tbody>
          {data.map((r) => (
            <tr key={`${r.material}-${r.parti}`}>
              <td>
                <div className="materialCode">{r.material}</div>
                <div className="materialName">{r.name}</div>
              </td>
              <td>{r.type}</td>
              <td>{r.parti || "-"}</td>
              <td>{r.depo || "-"}</td>
              <td>{r.stokTipi || "-"}</td>
              <td className="num">{format(r.en, 1)}</td>
              <td className="num">{r.dilmeEni || "-"}</td>
              <td className="num">{format(r.uzunluk)}</td>
              <td className="num">{format(r.miktar)}</td>
              <td className="num">{r.used > 0 ? format(r.used) : "-"}</td>
              <td>
                <span className={STATUS_CLASS[r.status]}>{r.status}</span>
              </td>
              <td className="reason">
                {r.reason}
                {r.machines && r.status !== DURUM.DEPO && (
                  <div className="muted">Hat: {r.machines}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
