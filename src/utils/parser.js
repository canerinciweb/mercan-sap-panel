function parseSAPNumber(value, isLength = false) {
  if (value === "" || value === null || value === undefined) return 0;

  let text = String(value).trim();
  if (!text) return 0;

  // SAP: 12.522,706 -> 12522.706
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text)) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  // SAP: 12.040 -> 12040
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replace(/\./g, ""));
  }

  // SAP: 25,3 -> 25.3
  if (/^\d+,\d+$/.test(text)) {
    return Number(text.replace(",", "."));
  }

  let num = Number(text);

  // >>> ASIL DÜZELTME <<<
  // Excel 12.040'ı 12.04 olarak okumuşsa geri çevir.
  if (isLength && num > 0 && num < 1000 && text.includes(".")) {
    const decimals = text.split(".")[1]?.length || 0;

    if (decimals <= 2) {
      num *= 1000;
    }
  }

  return num || 0;
}

export function parseZparti(rows) {
  return rows
    .map((row) => ({
      material: String(row["Malzeme"] || "").trim(),
      name: row["Malzeme Adı"] || "",
      usable: parseSAPNumber(row["Uzunluk"], true),
      stock: parseSAPNumber(row["Uzunluk"], true),
    }))
    .filter((row) => row.material);
}

export function parseZpp(rows) {
  return rows
    .map((row) => {
      const machine = String(row["İşyeri"] || "").trim();
      const material = String(row["Bileşen GK"] || "").trim();

      const isRaw =
        (machine.startsWith("L") || machine.startsWith("S")) &&
        material.startsWith("4");

      return {
        machine,
        jobOrder: String(row["MES İşEmri"] || "").trim(),
        material,
        name: row["Kalem tipi tanımı"] || row["Mlz.Adı"] || "",
        type: isRaw ? "Hammadde" : "Silikon",
        startDate: row["Pln.Bş.Ter"] || "",
        need: parseSAPNumber(row["Pl.kalan miktar"], true),
      };
    })
    .filter((row) => row.machine && row.material);
}