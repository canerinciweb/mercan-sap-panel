import * as XLSX from "xlsx";

/*
  Excel'in ilk sayfasını okur.
  headers : { A: "Ürt.Yeri", B: "İşyeri", ... }  (1. satır)
  rows    : [{ A: ..., B: ..., AF: 46290, ... }]  (kolon harfiyle)

  Sayısal hücrelerde ham değer (cell.v) kullanılır.
  Tarih/saat hücreleri Excel seri sayısı olarak gelir (46290, 0.5835...).
*/
export async function readExcel(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet || !sheet["!ref"]) return { headers: {}, rows: [] };

  const range = XLSX.utils.decode_range(sheet["!ref"]);

  const value = (r, c) => {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (!cell || cell.t === "e") return "";
    return cell.v ?? "";
  };

  const headers = {};
  for (let c = range.s.c; c <= range.e.c; c++) {
    headers[XLSX.utils.encode_col(c)] = String(value(range.s.r, c)).trim();
  }

  const rows = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = {};
    let hasData = false;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const v = value(r, c);
      row[XLSX.utils.encode_col(c)] = v;
      if (v !== "") hasData = true;
    }

    if (hasData) rows.push(row);
  }

  return { headers, rows };
}
