import * as XLSX from "xlsx";

export function exportStockExcel(data) {
  const rows = data.map((item) => ({
  "Malzeme Kodu": item.material,
  "Malzeme Adı": item.name,
  "Tip": item.type,
  "Parti": item.parti,
  "Depo Yeri": item.depo,
  "En": item.en,
  "Uzunluk (m)": item.uzunluk,
  "Alan (m²)": Math.round(item.usable * 100) / 100,
  "Kullanılacak (m²)": Math.round(item.used * 100) / 100,
  "Durum": item.reason || item.action,
  "Hatlar": item.machines,
}));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Stok Listesi");

  XLSX.writeFile(
    wb,
    `SAP_Stok_Listesi_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}