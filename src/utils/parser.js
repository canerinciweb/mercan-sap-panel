function parseSAPNumber(value) {
  if (value === "" || value == null) return 0;

  if (typeof value === "number") {
    return value;
  }

  const text = String(value).trim();

  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text))
    return Number(text.replace(/\./g, "").replace(",", "."));

  if (/^\d{1,3}(\.\d{3})+$/.test(text))
    return Number(text.replace(/\./g, ""));

  if (/^\d+,\d+$/.test(text))
    return Number(text.replace(",", "."));

  return Number(text) || 0;
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