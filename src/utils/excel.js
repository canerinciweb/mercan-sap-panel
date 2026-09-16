import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,
    cellNF: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet, {
    raw: false,   // görünen metni al
    defval: "",
  });
}