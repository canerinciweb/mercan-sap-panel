const format = (v, d = 1) =>
  Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: d });

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
    : "-";

export default function SummaryTable({ data }) {
  if (!data.length) {
    return <div className="stockTable emptyTable">Gösterilecek kayıt yok.</div>;
  }

  return (
    <div className="stockTable">
      <table>
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>İlk Başlangıç</th>
            <th>Tip</th>
            <th>İş Emri</th>
            <th>Parti</th>
            <th>Kullanılabilir M.</th>
            <th>PL Kalan</th>
            <th>Fark</th>
            <th>Depoya Gidecek</th>
            <th>Durum</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.material}>
              <td>
                <div className="materialCode">{item.material}</div>
                <div className="materialName">{item.name}</div>
              </td>
              <td>{formatDate(item.startDate)}</td>
              <td>{item.type}</td>
              <td>{item.jobCount}</td>
              <td>{item.partiCount}</td>
              <td>{format(item.usable)}</td>
              <td>{format(item.need)}</td>
              <td className={item.result >= 0 ? "greenText" : "redText"}>{format(item.result)}</td>
              <td>{item.depotArea > 0 ? format(item.depotArea) : "-"}</td>
              <td>
                <button
                  className={
                    item.action === "Kritik"
                      ? "statusButton red"
                      : item.action === "Depoya Gönder"
                      ? "statusButton blue"
                      : "statusButton green"
                  }
                >
                  {item.action}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
