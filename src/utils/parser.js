function parseSAPNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  // Excel sayıyı zaten number olarak veriyorsa aynen kullan
  if (typeof value === "number") return value;

  let text = String(value).trim();

  // 12.522,706 -> 12522.706
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text)) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  // 12.040 -> 12040
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    return Number(text.replace(/\./g, ""));
  }

  // 214,855 -> 214.855
  if (/^\d+,\d+$/.test(text)) {
    return Number(text.replace(",", "."));
  }

  // Normal sayı
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