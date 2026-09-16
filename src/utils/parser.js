function parseSAPNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  let text = String(value).trim();

  text = text.replace(/\./g, "").replace(",", ".");

  return Number(text) || 0;
}

export function parseZparti(rows) {
  return rows
    .map((row) => ({
      material: String(row["Malzeme"] || "").trim(),
      name: row["Malzeme Adı"] || "",
      usable: parseSAPNumber(row["Uzunluk"]),
    }))
    .filter((x) => x.material);
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
        material,
        jobOrder: String(row["MES İşEmri"] || "").trim(),
        name: row["Mlz.Adı"] || "",
        type: isRaw ? "Hammadde" : "Silikon",
        startDate: row["Pln.Bş.Ter"] || "",
        need: parseSAPNumber(row["Pl.kalan miktar"]),
      };
    })
    .filter((x) => x.material);
}