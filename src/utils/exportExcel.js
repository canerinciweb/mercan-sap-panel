import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportDepotExcel(data) {
  const exportData = data
    .filter(item => item.action === "Depoya Gönder")
    .map(item => ({
      "Malzeme": item.material,
      "Malzeme Adı": item.name,
      "Tip": item.type,
      "Hat": item.machines,
      "MES İşEmri": item.jobOrders || "",
      "Mevcut Stok": item.stock,
      "3 Gün İhtiyaç": item.need,
      "Kalacak": item.remaining
    }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Depoya Gönder");

  const buffer = XLSX.write(wb, {
    type: "array",
    bookType: "xlsx"
  });

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    `Depoya_Gonder_${new Date().toISOString().slice(0,10)}.xlsx`
  );
}