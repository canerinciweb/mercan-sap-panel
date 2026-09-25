const format = (v, d = 1) =>
  Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: d });

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
    : "-";

function buttonClass(item) {
  if (item.action === "Kritik") return "statusButton red";
  if (item.reason === "En uyumsuz") return "statusButton gray";
  if (item.action === "Depoya Gönder") return "statusButton blue";
  if (item.action === "Kısmi") return "statusButton amber";
  return "statusButton green";
}

function planText(item) {
  if (item.reason === "ZPARTİ'de yok")
    return `İhtiyaç ${format(item.missing)}, ${formatDate(item.startDate)} ${item.machines}`;
  if (item.missing > 0)
    return `${format(item.missing)} eksik, ${formatDate(item.startDate)} ${item.machines}`;
  if (item.need > 0) return `İlk: ${formatDate(item.startDate)} ${item.machines}`;
  if (item.nextDate) return `Sonraki: ${formatDate(item.nextDate)}`;
  return "Planda sonraki iş yok";
}

export default function StockTable({ data }) {
  if (!data.length) {
    return (
      <div className="stockTable emptyTable">
        Gösterilecek kayıt yok. ZPP022 ve ZPARTİ dosyalarını yükle ya da filtreleri değiştir.
      </div>
    );
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
            <th>Parti Eni</th>
            <th>TopDlmEni</th>
            <th>Uzunluk (m)</th>
            <th>Kullanılabilir M.</th>
            <th>Kullanılacak</th>
            <th>Durum</th>
            <th>Plan</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, i) => (
            <tr key={`${item.material}-${item.parti}-${item.dilmeEni}-${i}`}>
              <td>
                <div className="materialCode">{item.material}</div>
                <div className="materialName">{item.name}</div>
              </td>
              <td>{item.type}</td>
              <td>{item.parti}</td>
              <td>{item.depo || "-"}</td>
              <td>{item.en ? format(item.en, 0) : "-"}</td>
              <td>{item.dilmeEni || "-"}</td>
              <td>{item.uzunluk ? format(item.uzunluk) : "-"}</td>
              <td>{item.usable ? format(item.usable) : "-"}</td>
              <td>{item.used > 0 ? format(item.used) : "-"}</td>
              <td>
                <button className={buttonClass(item)}>{item.reason || item.action}</button>
              </td>
              <td className="jobOrders">{planText(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
