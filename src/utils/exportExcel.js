import * as XLSX from "xlsx";

export function exportStockExcel(data) {
  const rows = data.map((item) => ({
    "Malzeme Kodu": item.material,
    "Malzeme Adı": item.name,
    "MES İşEmri": item.jobOrders,
    "Tip": item.type,
    "Hatlar": item.machines,
    "Mevcut Stok": item.stock,
    "3 Gün İhtiyaç": item.need,
    "Kalacak": item.remaining,
    "Durum": item.action,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Stok Listesi");

  XLSX.writeFile(
    wb,
    `SAP_Stok_Listesi_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}