import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    cellText: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false, // SAP'nin görünen metnini al
  });
}