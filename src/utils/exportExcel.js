import * as XLSX from "xlsx";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function exportStockExcel(data) {
  const rows = data.map((item) => ({
    "Malzeme Kodu": item.material,
    "Malzeme Adı": item.name,
    "Tip": item.type,
    "Parti": item.parti,
    "Depo Yeri": item.depo,
    "Parti Eni": item.en,
    "TopDlmEni": item.dilmeEni,
    "Uzunluk (m)": r2(item.uzunluk),
    "Kullanılabilir M.": r2(item.usable),
    "Kullanılacak": r2(item.used),
    "Boşta Kalan": r2(Math.max(item.remaining, 0)),
    "Eksik / İhtiyaç": r2(item.missing),
    "Durum": item.action,
    "Neden": item.reason,
    "Hatlar": item.machines,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Stok Listesi");

  XLSX.writeFile(wb, `SAP_Stok_Listesi_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
