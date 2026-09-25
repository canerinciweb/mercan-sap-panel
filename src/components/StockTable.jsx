export default function StockTable({ data }) {
  const format = (v, d = 1) =>
    Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: d });

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";

  const buttonClass = {
    "Kritik": "statusButton red",
    "Depoya Gönder": "statusButton blue",
    "Kısmi": "statusButton amber",
    "Kullanılacak": "statusButton green",
  };

  return (
    <div className="stockTable">
      <table>
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>Tip</th>
            <th>Parti</th>
            <th>Depo Yeri</th>
            <th>En</th>
            <th>Uzunluk (m)</th>
            <th>Alan (m²)</th>
            <th>Kullanılacak (m²)</th>
            <th>Durum</th>
            <th>Plan</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={`${item.material}-${item.parti}`}>
              <td>
                <div className="materialCode">{item.material}</div>
                <div className="materialName">{item.name}</div>
              </td>
              <td>{item.type}</td>
              <td>{item.parti || "-"}</td>
              <td>{item.depo || "-"}</td>
              <td>{format(item.en, 0)}</td>
              <td>{format(item.uzunluk)}</td>
              <td>{format(item.usable)}</td>
              <td>{item.used > 0 ? format(item.used) : "-"}</td>
              <td>
                <button className={buttonClass[item.action]}>
                  {item.reason || item.action}
                </button>
              </td>
              <td className="jobOrders">
                {item.need > 0
                  ? `İlk: ${formatDate(item.startDate)} ${item.machines}`
                  : item.nextDate
                  ? `Sonraki: ${formatDate(item.nextDate)}`
                  : "Planda sonraki iş yok"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}