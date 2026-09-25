import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet["!ref"]) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headers = {};

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    headers[c] = String(cell?.v ?? "").trim();
  }

  const rows = [];

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const obj = {};

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      const value = cell ? cell.v ?? "" : "";

      obj[XLSX.utils.encode_col(c)] = value;   // row["AF"]
      if (headers[c]) obj[headers[c]] = value; // row["Bileşen GK"]
    }

    rows.push(obj);
  }

  return rows;
}