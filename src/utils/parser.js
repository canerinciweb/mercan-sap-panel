function parseSAPNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  let text = String(value).trim();

  // Boşsa
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

  return Number(text) || 0;
}

export function parseZparti(rows) {
  return rows
    .map((row) => ({
      material: String(row["Malzeme"] || "").trim(),
      name: row["Malzeme Adı"] || "",

      // ZPARTİ → Uzunluk
      usable: parseSAPNumber(row["Uzunluk"]),

      // Eski kodlarla uyumluluk
      stock: parseSAPNumber(row["Uzunluk"]),
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

        // ZPPSTOK → PL Kalan
        need: parseSAPNumber(row["Pl.kalan miktar"]),
      };
    })
    .filter((row) => row.machine && row.material);
}