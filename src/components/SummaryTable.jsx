export default function SummaryTable({ data }) {
  const format = (value) =>
    Number(value || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });

  return (
    <div className="stockTable">
      <table>
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>Tip</th>
            <th>İş Emri</th>
            <th>Kullanılabilir</th>
            <th>PL Kalan</th>
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

              <td>{format(item.usable)} M²</td>

              <td>{format(item.need)} M²</td>

              <td className={item.result >= 0 ? "greenText" : "redText"}>
                {format(item.result)} M²
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