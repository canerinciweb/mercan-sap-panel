function parseSAPNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  // Excel sayıyı zaten number olarak veriyorsa aynen kullan
  if (typeof value === "number") return value;

  let text = String(value).trim();

  // 12.522,706 -> 12522.706
  if (text.includes(".") && text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
    return Number(text);
  }

  // 214,855 -> 214.855
  if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  return Number(text) || 0;
}

export function parseZparti(rows) {
  return rows
    .map((row) => ({
      material: String(row["Malzeme"] || "").trim(),
      name: row["Malzeme Adı"] || "",

      // Eski Kullanılabilir M. yerine Uzunluk kullanılacak
      usable: parseSAPNumber(row["Uzunluk"]),

      // Eski kodlarla uyumluluk için stock'u da aynı yapıyoruz
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

        // Artık PL Kalan Miktar okunuyor
        need: parseSAPNumber(row["Pl.kalan miktar"]),
      };
    })
    .filter((row) => row.machine && row.material);
}