import * as XLSX from "xlsx";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmtDate = (d) =>
  d ? d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "";
const stamp = () => new Date().toISOString().slice(0, 10);

function infoSheet(meta) {
  return XLSX.utils.aoa_to_sheet([
    ["Rapor tarihi", fmtDate(new Date())],
    ["Başlangıç", fmtDate(meta.refDate)],
    ["Bitiş", fmtDate(meta.windowEnd)],
    ["Gün", meta.days],
    ["En toleransı", `TopDlmEni -${meta.tolAlt} cm / +${meta.tolUst} cm`],
  ]);
}

function save(sheetName, rows, meta, fileName) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName);
  XLSX.utils.book_append_sheet(wb, infoSheet(meta), "Bilgi");
  XLSX.writeFile(wb, `${fileName}_${meta.days}gun_${stamp()}.xlsx`);
}

export function exportPartiExcel(data, meta) {
  const rows = data.map((r) => ({
    "Malzeme": r.material,
    "Malzeme Adı": r.name,
    "Tip": r.type,
    "Parti": r.parti,
    "Depo Yeri": r.depo,
    "Stok Tipi": r.stokTipi,
    "En (cm)": r.en,
    "TopDlmEni (cm)": r.dilmeEni,
    "Uzunluk (m)": r2(r.uzunluk),
    "Kullanılabilir (m²)": r2(r.miktar),
    "Kullanılacak (m²)": r2(r.used),
    "Durum": r.status,
    "Açıklama": r.reason,
    "Hatlar": r.machines,
    "İlk İhtiyaç": fmtDate(r.firstStart),
    "Sonraki İhtiyaç": fmtDate(r.nextStart),
  }));

  save("Partiler", rows, meta, "Parti_Raporu");
}

export function exportIhtiyacExcel(data, meta) {
  const rows = data.map((r) => ({
    "Malzeme": r.material,
    "Malzeme Adı": r.name,
    "Tip": r.type,
    "TopDlmEni (cm)": r.dilmeEni,
    "İlk Başlangıç": fmtDate(r.firstStart),
    "Hatlar": r.machines,
    "İş Emri Sayısı": r.jobCount,
    "Pl. Kalan (m²)": r2(r.need),
    "Uygun Stok (m²)": r2(r.fittingStock),
    "Uygun Parti": r.fittingCount,
    "Karşılanan (m²)": r2(r.covered),
    "Eksik (m²)": r2(r.missing),
    "Durum": r.status,
  }));

  save("İhtiyaç", rows, meta, "Ihtiyac_Ozeti");
}
