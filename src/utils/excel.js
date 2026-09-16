import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellNF: true,
    cellStyles: true,
    cellDates: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet["!ref"]) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headers = [];

  // Başlıkları oku
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    headers.push(String(cell?.w ?? cell?.v ?? "").trim());
  }

  const rows = [];

  // Satırları oku (görünen değeri al)
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const obj = {};

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];

      obj[headers[c - range.s.c]] = cell
        ? String(cell.w ?? cell.v ?? "").trim()
        : "";
    }

    rows.push(obj);
  }

  return rows;
}