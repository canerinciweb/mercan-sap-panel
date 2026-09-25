/* =========================================================
   KOLON AYARLARI
   col    : beklenen kolon harfi
   header : o kolonda beklenen başlık
   Başlık beklenen harfte değilse aynı başlık başka kolonda aranır,
   bulunursa oradan okunur ve ekranda uyarı gösterilir.
========================================================= */

export const ZPP_COLS = {
  isyeri:     { col: "B",  header: "İşyeri" },
  isEmri:     { col: "D",  header: "MES İşEmri" },
  bilesen:    { col: "J",  header: "Bileşen GK" },
  bilesenAdi: { col: "K",  header: "Mlz.Adı" },
  kalemTipi:  { col: "L",  header: "KlmTp" },
  dilmeEni:   { col: "N",  header: "TopDlmEni" },
  plKalan:    { col: "O",  header: "Pl.kalan miktar" },
  basTarih:   { col: "AF", header: "Pln.Bş.Ter" },
  basSaat:    { col: "AG", header: "PlnBaşSaat" },
  bitTarih:   { col: "AI", header: "Pln.Bt.Ter" },
  bitSaat:    { col: "AJ", header: "PlnBitSaat" },
};

export const ZPARTI_COLS = {
  malzeme:        { col: "B", header: "Malzeme" },
  malzemeAdi:     { col: "C", header: "Malzeme Adı" },
  parti:          { col: "D", header: "Parti" },
  kullanilabilir: { col: "F", header: "Kullanılabilir M." },
  uzunluk:        { col: "G", header: "Uzunluk" },
  en:             { col: "H", header: "En" },
  depo:           { col: "N", header: "Depo" },
  stokTipi:       { col: "Q", header: "StokTipi" },
};

/* ZPP022 L kolonu */
export const KALEM_TIPLERI = {
  U: "Üst Kağıt",
  A: "Alt Kağıt",
  F: "Y.M. Üst",
  G: "Y.M. Alt",
};

/* ---------- Kolon çözümleme ---------- */

const norm = (s) =>
  String(s ?? "").toLocaleLowerCase("tr").replace(/\s+/g, "").replace(/\.+$/, "");

function resolveColumns(headers, spec, fileLabel) {
  const cols = {};
  const warnings = [];

  for (const [key, def] of Object.entries(spec)) {
    if (norm(headers[def.col]) === norm(def.header)) {
      cols[key] = def.col;
      continue;
    }

    const found = Object.keys(headers).find((c) => norm(headers[c]) === norm(def.header));

    if (found) {
      cols[key] = found;
      warnings.push(`${fileLabel}: "${def.header}" ${def.col} yerine ${found} kolonunda bulundu.`);
    } else {
      cols[key] = def.col;
      warnings.push(
        `${fileLabel}: ${def.col} kolonunda "${def.header}" bekleniyordu, "${headers[def.col] || "boş"}" bulundu.`
      );
    }
  }

  return { cols, warnings };
}

/* ---------- Değer dönüştürücüler ---------- */

/* Ham sayı gelirse olduğu gibi, metin gelirse Türkçe format */
export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  let t = String(value ?? "").trim().replace(/\s/g, "");
  if (!t) return 0;

  if (t.includes(",") && t.includes(".")) {
    t = t.lastIndexOf(",") > t.lastIndexOf(".")
      ? t.replace(/\./g, "").replace(",", ".")   // 12.522,706
      : t.replace(/,/g, "");                      // 12,522.706
  } else if (t.includes(",")) {
    t = t.replace(",", ".");                      // 25,3
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, "");                     // 12.040
  }

  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/* "000000441507502" ile "441507502" aynı olsun */
export function normCode(value) {
  const t =
    typeof value === "number" ? String(Math.round(value)) : String(value ?? "").trim();
  return /^\d+$/.test(t) ? t.replace(/^0+(?=\d)/, "") : t;
}

function toDate(value) {
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

  let m = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/); // 14:00:18
  if (m) return +m[1] * 3600 + +m[2] * 60 + (+m[3] || 0);

  m = text.match(/^(\d{2})(\d{2})(\d{2})$/); // 140018
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];

  return 0;
}

function dateTime(dateValue, timeValue) {
  const d = toDate(dateValue);
  if (!d) return null;
  return new Date(d.getTime() + toSeconds(timeValue) * 1000);
}

/* =========================================================
   ZPP022
========================================================= */
export function parseZpp({ headers, rows }) {
  const { cols, warnings } = resolveColumns(headers, ZPP_COLS, "ZPP022");
  const get = (row, key) => row[cols[key]];

  const items = [];
  let skipped = 0;

  rows.forEach((row) => {
    const tip = String(get(row, "kalemTipi") ?? "").trim().toUpperCase();
    const material = normCode(get(row, "bilesen"));

    if (!KALEM_TIPLERI[tip] || !material) {
      skipped++;
      return;
    }

    items.push({
      material,
      name: String(get(row, "bilesenAdi") ?? "").trim(),
      tip,
      type: KALEM_TIPLERI[tip],
      machine: String(get(row, "isyeri") ?? "").trim(),
      jobOrder: String(get(row, "isEmri") ?? "").trim(),
      dilmeEni: toNumber(get(row, "dilmeEni")),
      plKalan: toNumber(get(row, "plKalan")),
      start: dateTime(get(row, "basTarih"), get(row, "basSaat")),
      end: dateTime(get(row, "bitTarih"), get(row, "bitSaat")),
    });
  });

  return { items, warnings, total: rows.length, skipped };
}

/* =========================================================
   ZPARTİ
========================================================= */
export function parseZparti({ headers, rows }) {
  const { cols, warnings } = resolveColumns(headers, ZPARTI_COLS, "ZPARTİ");
  const get = (row, key) => row[cols[key]];

  const items = rows
    .map((row) => ({
      material: normCode(get(row, "malzeme")),
      name: String(get(row, "malzemeAdi") ?? "").trim(),
      parti: String(get(row, "parti") ?? "").trim(),
      depo: String(get(row, "depo") ?? "").trim(),
      stokTipi: String(get(row, "stokTipi") ?? "").trim(),
      miktar: toNumber(get(row, "kullanilabilir")), // m²
      uzunluk: toNumber(get(row, "uzunluk")),       // m
      en: toNumber(get(row, "en")),                 // cm
    }))
    .filter((r) => r.material);

  return { items, warnings, total: rows.length };
}
