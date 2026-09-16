export default function StockTable({ data }) {
  const format = (value) =>
    Number(value || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });

  return (
    <div className="tableWrap">
      <table className="stockTable">
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>MES İşEmri</th>
            <th>Tip</th>
            <th>Hatlar</th>
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
                <strong>{item.material}</strong>
                <div className="sub">{item.name}</div>
              </td>

              <td className="sub">{item.jobOrders}</td>

              <td>{item.type}</td>

              <td>{item.machines}</td>

              <td>{format(item.usable)} M²</td>

              <td>{format(item.need)} M²</td>

              <td className={item.remaining < 0 ? "redText" : "greenText"}>
                {format(item.remaining)} M²
              </td>

              <td>
                <span
                  className={
                    item.action === "Kritik"
                      ? "status danger"
                      : item.action === "Depoya Gönder"
                      ? "status transfer"
                      : "status success"
                  }
                >
                  {item.action}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}