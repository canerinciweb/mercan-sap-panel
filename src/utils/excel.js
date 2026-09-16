import * as XLSX from "xlsx";

export async function readExcel(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellText: true,   // Hücrede görünen metni al
    cellNF: true,
    cellDates: true,
  });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet, {
    raw: false,        // Excel'de görünen formatı koru
    defval: "",
  });
}