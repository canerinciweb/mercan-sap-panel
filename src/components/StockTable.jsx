export default function StockTable({ data }) {
  const format = (value) =>
    Number(value || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("tr-TR");
  };

  return (
    <div className="tableWrap">
      <table className="stockTable">
        <thead>
          <tr>
            <th>Malzeme</th>
            <th>MES İşEmri</th>
            <th>Planlanan Başlangıç</th>
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
                <div className="materialCode">{item.material}</div>
                <div className="materialName">{item.name}</div>
              </td>

              <td>
                <div className="jobOrders">{item.jobOrders}</div>
              </td>

              <td>{formatDate(item.startDate)}</td>

              <td>{item.type}</td>

              <td>{item.machines}</td>

              <td>{format(item.usable)} M²</td>

              <td>{format(item.need)} M²</td>

              <td className={item.remaining >= 0 ? "greenText" : "redText"}>
                {format(item.remaining)} M²
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