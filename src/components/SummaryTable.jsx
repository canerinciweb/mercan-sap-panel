export default function SummaryTable({ data }) {
  return (
    <div className="stockTable">
      <table>
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>Tip</th>
            <th>İş Emri</th>
            <th>Stok</th>
            <th>3 Gün İhtiyaç</th>
            <th>Sonuç</th>
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

              <td>{item.type}</td>

              <td>{item.jobCount}</td>

              <td>{item.stock.toLocaleString("tr-TR")} M²</td>

              <td>{item.need.toLocaleString("tr-TR")} M²</td>

              <td className={item.result < 0 ? "redText" : "greenText"}>
                {item.result.toLocaleString("tr-TR")} M²
              </td>

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