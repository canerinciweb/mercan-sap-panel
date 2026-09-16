import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellNF: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet["!ref"]) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headers = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
    headers.push((cell?.w ?? cell?.v ?? "").toString().trim());
  }

  const rows = [];

  for (let r = 1; r <= range.e.r; r++) {
    const obj = {};

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];

      obj[headers[c]] = cell ? (cell.w ?? cell.v ?? "") : "";
    }

    rows.push(obj);
  }

  return rows;
}