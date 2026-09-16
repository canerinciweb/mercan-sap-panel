import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellNF: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet["!ref"]);

  const headers = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    headers.push(sheet[addr]?.w ?? sheet[addr]?.v ?? "");
  }

  const rows = [];

  for (let r = 1; r <= range.e.r; r++) {
    const obj = {};

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];

      obj[headers[c]] = cell ? (cell.w ?? cell.v ?? "") : "";
    }

    rows.push(obj);
  }

  return rows;
}