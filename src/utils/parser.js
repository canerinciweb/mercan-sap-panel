function parseSAPNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  let text = String(value).trim();

  // SAP: 12.522,706
  if (text.includes(",") && text.includes(".")) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  // SAP: 12.040 -> 12040
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replace(/\./g, ""));
  }

  // 214,855 -> 214.855
  if (text.includes(",")) {
    return Number(text.replace(",", "."));
  }

  return Number(text) || 0;
}

export function parseZparti(rows) {
  return rows
    .map((row) => ({
      material: String(row["Malzeme"] || "").trim(),
      name: row["Malzeme Adı"] || "",

      // Yeni mantık: Uzunluk kullanılabilir metraj
      usable: parseSAPNumber(row["Uzunluk"]),

      // Eski kodlarla uyumluluk için
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

        // Yeni mantık: PL Kalan Miktar
        need: parseSAPNumber(row["Pl.kalan miktar"]),
      };
    })
    .filter((row) => row.machine && row.material);
}