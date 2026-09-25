const TIPLER = {
  U: "Üst Kağıt",
  A: "Alt Kağıt",
  F: "Y.M. Üst",
  G: "Y.M. Alt",
};

/* Ham sayı gelirse olduğu gibi, metin gelirse Türkçe format */
function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  let t = String(value ?? "").trim().replace(/\s/g, "");
  if (!t) return 0;

  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", "."); // 12.522,706
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // 12.040

  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/* "000000441507502" ile "441507502" aynı olsun */
function normCode(value) {
  const t =
    typeof value === "number" ? String(Math.round(value)) : String(value ?? "").trim();
  return /^\d+$/.test(t) ? t.replace(/^0+(?=\d)/, "") : t;
}

function toDate(value) {
  if (value instanceof Date) return isNaN(value) ? null : value;

  if (typeof value === "number" && value > 0) {
    return new Date(1899, 11, 30 + Math.floor(value));
  }

  const text = String(value ?? "").trim();

  let m = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/); // 25.09.2026
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); // 2026-09-25
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  return null;
}

function toSeconds(value) {
  if (typeof value === "number") return Math.round((value % 1) * 86400);

  const text = String(value ?? "").trim();

  let m = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/); // 14:30 / 14:30:00
  if (m) return +m[1] * 3600 + +m[2] * 60 + (+m[3] || 0);

  m = text.match(/^(\d{2})(\d{2})(\d{2})$/); // 143000
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];

  return 0;
}

/* Başlık adına göre değer al (büyük/küçük harf ve boşluk farkını yok sayar) */
const normKey = (k) => String(k).toLocaleLowerCase("tr").replace(/\s+/g, "").replace(/\.$/, "");

function pick(row, names, fallbackCol) {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
  }

  const wanted = names.map(normKey);
  for (const key of Object.keys(row)) {
    if (wanted.includes(normKey(key))) return row[key];
  }

  return fallbackCol ? row[fallbackCol] : undefined;
}

function dateTime(dateValue, timeValue) {
  const d = toDate(dateValue);
  if (!d) return null;

  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return new Date(base.getTime() + toSeconds(timeValue) * 1000);
}

/* ===========================
   ZPARTİ
   Malzeme, Kullanılabilir M., D parti, G uzunluk, H en, N depo yeri
=========================== */
const KULLANILABILIR = ["Kullanılabilir M.", "Kullanılabilir M", "Kullanılabilir miktar", "Kullanılabilir"];

export function parseZparti(rows) {
  return rows
    .map((row) => {
      const uzunluk = toNumber(row["G"]);
      const en = toNumber(row["H"]);
      const kullanilabilir = pick(row, KULLANILABILIR);

      return {
        material: normCode(pick(row, ["Malzeme"], "B")),
        name: String(pick(row, ["Malzeme Adı", "Malzeme kısa metni"]) ?? "").trim(),
        parti: String(pick(row, ["Parti"], "D") ?? "").trim(),
        depo: String(pick(row, ["Depo yeri"], "N") ?? "").trim(),
        uzunluk,
        en,
        // Stok miktarı: Kullanılabilir M. kolonu (yoksa uzunluk x en)
        alan: kullanilabilir !== undefined ? toNumber(kullanilabilir) : (uzunluk * en) / 1000,
        hasKullanilabilir: kullanilabilir !== undefined,
      };
    })
    .filter((r) => r.material);
}

/* ===========================
   ZPP022
   Bileşen GK, Pl.kalan miktar, L tip, TopDlmEni, AF+AG başlangıç, AI+AC bitiş
=========================== */
export function parseZpp(rows) {
  return rows
    .map((row) => {
      const tip = String(row["L"] ?? "").trim().toUpperCase();

      return {
        tip,
        type: TIPLER[tip] || "",
        machine: String(pick(row, ["İşyeri", "İş yeri"]) ?? "").trim(),
        jobOrder: String(pick(row, ["MES İşEmri", "MES İş Emri"]) ?? "").trim(),
        material: normCode(pick(row, ["Bileşen GK", "Bileşen"])),
        name: String(row["Mlz.Adı"] ?? "").trim(),
        dilmeEni: toNumber(pick(row, ["TopDlmEni"], "N")),
        need: toNumber(pick(row, ["Pl.kalan miktar", "Pl. kalan miktar", "PL kalan miktar"], "O")),
        start: dateTime(row["AF"], row["AG"]),
        end: dateTime(row["AI"], row["AC"]),
      };
    })
    .filter((r) => TIPLER[r.tip] && r.material);
}
