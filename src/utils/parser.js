function parseSAPNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;

  if (typeof value === "number") return value;

  let text = String(value).trim();

  // 12.522,706 -> 12522.706
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(text)) {
    text = text.replace(/\./g, "").replace(",", ".");
    return Number(text);
  }

  // 214.855 -> 214855
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "");
    return Number(text);
  }

  // 214,855 -> 214.855
  if (/^\d+,\d+$/.test(text)) {
    text = text.replace(",", ".");
    return Number(text);
  }

  return Number(text) || 0;
}

export function parseZparti(rows) {
  return rows
    .map((row) => ({
      material: String(row["Malzeme"] || "").trim(),
      name: row["Malzeme Adı"] || "",
      stock: parseSAPNumber(row["Kullanılabilir M."]),
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
        name: row["Mlz.Adı"] || "",
        type: isRaw ? "Hammadde" : "Diger",
        startDate: row["Pln.Bş.Ter"] || "",
        need: parseSAPNumber(row["İhtiyaç miktarı"]),
      };
    })
    .filter((row) => row.machine && row.material);
}