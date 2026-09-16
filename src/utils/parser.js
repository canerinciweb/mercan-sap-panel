function parseLength(value) {
  if (value === "" || value == null) return 0;

  const text = String(value).trim();

  if (!text) return 0;

  // 11,980 -> 11980
  if (/^\d+,\d{3}$/.test(text)) {
    return Number(text.replace(",", ""));
  }

  // 12.040 -> 12040
  if (/^\d+\.\d{3}$/.test(text)) {
    return Number(text.replace(".", ""));
  }

  // 12.522,706 -> 12522.706
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text)) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  return Number(text.replace(",", ".")) || 0;
}

function parsePL(value) {
  if (value === "" || value == null) return 0;

  const text = String(value).trim();

  if (!text) return 0;

  // 193.675,050
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text)) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  // 25,3
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
      usable: parseLength(row["Uzunluk"]),
      stock: parseLength(row["Uzunluk"]),
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
        need: parsePL(row["Pl.kalan miktar"]),
      };
    })
    .filter((row) => row.machine && row.material);
}