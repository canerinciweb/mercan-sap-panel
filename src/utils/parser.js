const TIPLER = { U: "Üst Kağıt", A: "Alt Kağıt", F: "Y.M. Üst", G: "Y.M. Alt" };

/* Ham sayı gelirse olduğu gibi, metin gelirse Türkçe format */
function toNumber(value) {
  if (typeof value === "number") return value;
  let t = String(value ?? "").trim().replace(/\s/g, "");
  if (!t) return 0;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");     // 12.522,706
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");    // 12.040
  return Number(t) || 0;
}

/* "000000441507502" ile "441507502" aynı olsun */
function normCode(value) {
  const t = String(value ?? "").trim();
  return /^\d+$/.test(t) ? t.replace(/^0+(?=\d)/, "") : t;
}

function toDate(value) {
  if (typeof value === "number" && value > 0)
    return new Date(1899, 11, 30 + Math.floor(value));
  const m = String(value ?? "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  return m ? new Date(+m[3], m[2] - 1, +m[1]) : null;
}

function toSeconds(value) {
  if (typeof value === "number") return Math.round((value % 1) * 86400);
  const m = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return m ? m[1] * 3600 + m[2] * 60 + (+m[3] || 0) : 0;
}

function dateTime(dateValue, timeValue) {
  const d = toDate(dateValue);
  return d ? new Date(d.getTime() + toSeconds(timeValue) * 1000) : null;
}

/* ZPARTİ: B malzeme, D parti, G uzunluk, H en, N depo yeri */
export function parseZparti(rows) {
  return rows
    .map((row) => {
      const uzunluk = toNumber(row["G"]);
      const en = toNumber(row["H"]);
      return {
        material: normCode(row["B"]),
        name: String(row["Malzeme Adı"] || "").trim(),
        parti: String(row["D"] || "").trim(),
        depo: String(row["N"] || "").trim(),
        uzunluk,
        en,
        alan: (uzunluk * en) / 1000, // en mm -> m²
      };
    })
    .filter((r) => r.material);
}

/* ZPP022: L tip, N dilme eni, O PL kalan, AF+AG başlangıç, AI+AC bitiş */
export function parseZpp(rows) {
  return rows
    .map((row) => {
      const tip = String(row["L"] || "").trim().toUpperCase();
      return {
        tip,
        type: TIPLER[tip] || "",
        machine: String(row["İşyeri"] || "").trim(),
        jobOrder: String(row["MES İşEmri"] || "").trim(),
        material: normCode(row["Bileşen GK"]),
        name: String(row["Mlz.Adı"] || "").trim(),
                dilmeEni: toNumber(row["TopDlmEni"] ?? row["N"]),
        need: toNumber(row["O"]), // PL kalan (m²)
        start: dateTime(row["AF"], row["AG"]),
        end: dateTime(row["AI"], row["AC"]),
      };
    })
    .filter((r) => TIPLER[r.tip] && r.material);
}