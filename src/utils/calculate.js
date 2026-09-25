/* =========================================================
   AYARLAR
========================================================= */

/* Parti eni (ZPARTİ H) ile TopDlmEni (ZPP022 N) toleransı, cm */
export const TOL_ALT = 1; // en en fazla 1 cm dar olabilir
export const TOL_UST = 2; // en en fazla 2 cm geniş olabilir

/* Üretimde kullanılabilen stok tipleri (BLOKE / KALİTE kullanılamaz) */
export const KULLANILABILIR_STOK = ["TAHDITSZ"];

export const DURUM = {
  DEPO: "Depoya Gönder",
  KULLANILMAYACAK: "Kullanılmayacak",
  KULLANILACAK: "Kullanılacak",
};

const DAY = 86400000;
const EPS = 0.001;

const byNo = (a, b) => String(a).localeCompare(String(b), "tr", { numeric: true });
const join = (list) => [...new Set(list)].filter(Boolean).join(", ");
const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const fmtDate = (d) =>
  d ? d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";

/* Dilme eni okunamadıysa (0) en kontrolü yapılmaz */
export function enUygun(partiEn, dilmeEni) {
  if (!dilmeEni) return true;
  return partiEn >= dilmeEni - TOL_ALT - 1e-9 && partiEn <= dilmeEni + TOL_UST + 1e-9;
}

const isUsableStock = (p) =>
  KULLANILABILIR_STOK.includes(String(p.stokTipi).toLocaleUpperCase("tr"));

/*
  zparti  : parseZparti().items
  zpp     : parseZpp().items   (sadece U / A / F / G)
  days    : seçilen gün sayısı
  refDate : başlangıç anı (varsayılan: şimdi)

  İHTİYAÇ KURALI
  Plan başlangıcı (refDate + days) anından önce olan ve Pl.kalan miktarı
  sıfırdan büyük her satır ihtiyaçtır. Geciken işler de dahildir.

  DAĞITIM
  İhtiyaç malzeme + TopDlmEni bazında toplanır. En erken başlayan grup önce
  karşılanır. Her grup, eni tolerans içinde olan TAHDITSZ partilerden
  parti numarası sırasıyla Kullanılabilir M. düşer.

  PARTİ DURUMU
  Depoya Gönder   : Seçilen sürede bu malzemenin hiç ihtiyacı yok
  Kullanılmayacak : Malzemenin ihtiyacı var ama bu parti kullanılmıyor
                    (en uyumsuz / ihtiyaç diğer partilerle karşılanıyor / bloke)
  Kullanılacak    : Partinin tamamı ya da bir kısmı tüketilecek
*/
export function buildReport(zparti, zpp, days, refDate = new Date()) {
  const windowEnd = new Date(refDate.getTime() + days * DAY);
  let noDate = 0;

  /* ---------- 1) İhtiyaçlar ---------- */
  const mats = new Map();

  zpp.forEach((it) => {
    if (!mats.has(it.material)) {
      mats.set(it.material, {
        name: it.name,
        types: new Set(),
        groups: new Map(),
        nextStart: null,
      });
    }

    const m = mats.get(it.material);
    if (!m.name && it.name) m.name = it.name;
    m.types.add(it.type);

    if (!(it.plKalan > EPS)) return;

    if (!it.start) {
      noDate++;
      return;
    }

    if (it.start > windowEnd) {
      if (!m.nextStart || it.start < m.nextStart) m.nextStart = it.start;
      return;
    }

    const width = it.dilmeEni || 0;

    if (!m.groups.has(width)) {
      m.groups.set(width, {
        width,
        need: 0,
        left: 0,
        firstStart: null,
        types: new Set(),
        machines: [],
        jobs: [],
      });
    }

    const g = m.groups.get(width);
    g.need += it.plKalan;
    g.types.add(it.type);
    g.machines.push(it.machine);
    g.jobs.push(it.jobOrder);
    if (!g.firstStart || it.start < g.firstStart) g.firstStart = it.start;
  });

  /* ---------- 2) Stok ----------
     Rulo malzemeler (En > 0) ile planda geçen malzemeler alınır.
     Su, boya, yapıştırıcı gibi En'i olmayan kalemler raporlanmaz. */
  const partiMap = new Map();

  zparti.forEach((p) => {
    if (!(p.en > 0) && !mats.has(p.material)) return;
    if (!partiMap.has(p.material)) partiMap.set(p.material, []);
    partiMap.get(p.material).push({ ...p, left: p.miktar, used: 0, fits: false });
  });

  partiMap.forEach((list) => list.sort((a, b) => byNo(a.parti, b.parti)));

  /* ---------- 3) Dağıtım ---------- */
  const needRows = [];

  mats.forEach((m, material) => {
    const partiler = partiMap.get(material) || [];
    const groups = [...m.groups.values()].sort((a, b) => a.firstStart - b.firstStart);

    groups.forEach((g) => {
      g.left = g.need;
      let fittingStock = 0;
      let fittingCount = 0;

      partiler.forEach((p) => {
        if (!enUygun(p.en, g.width)) return;
        p.fits = true;
        if (!isUsableStock(p)) return;

        fittingStock += p.miktar;
        fittingCount++;

        if (g.left <= EPS || p.left <= EPS) return;

        const take = Math.min(p.left, g.left);
        p.left -= take;
        p.used += take;
        g.left -= take;
      });

      const covered = g.need - Math.max(g.left, 0);

      needRows.push({
        material,
        name: m.name || "-",
        types: [...g.types],
        type: join(g.types),
        dilmeEni: g.width,
        firstStart: g.firstStart,
        machines: join(g.machines),
        jobCount: new Set(g.jobs.filter(Boolean)).size,
        need: g.need,
        fittingStock,
        fittingCount,
        covered,
        missing: Math.max(g.left, 0),
        status: !partiler.length
          ? "Stokta yok"
          : g.left > EPS
          ? covered > EPS
            ? "Eksik"
            : "Uygun parti yok"
          : "Yeterli",
      });
    });
  });

  /* ---------- 4) Parti satırları ---------- */
  const partiRows = [];

  partiMap.forEach((partiler, material) => {
    const m = mats.get(material);
    const groups = m ? [...m.groups.values()] : [];
    const hasNeed = groups.length > 0;
    const widths = groups.map((g) => g.width).filter(Boolean).sort((a, b) => a - b);

    partiler.forEach((p) => {
      let status;
      let reason;

      if (!hasNeed) {
        status = DURUM.DEPO;
        reason = m?.nextStart
          ? `${days} gün içinde ihtiyaç yok. Sonraki iş: ${fmtDate(m.nextStart)}`
          : m
          ? "Planda kalan ihtiyaç yok"
          : "İş planında (ZPP022) yok";
      } else if (!p.fits) {
        status = DURUM.KULLANILMAYACAK;
        reason = `En uyumsuz: parti ${fmt(p.en)} cm, TopDlmEni ${widths.map(fmt).join(" / ")} cm`;
      } else if (!isUsableStock(p)) {
        status = DURUM.KULLANILMAYACAK;
        reason = `Stok tipi ${p.stokTipi || "belirsiz"}, üretimde kullanılamaz`;
      } else if (p.used <= EPS) {
        status = DURUM.KULLANILMAYACAK;
        reason = "İhtiyaç önceki partilerle karşılanıyor";
      } else {
        status = DURUM.KULLANILACAK;
        reason =
          p.left > EPS
            ? `Kısmen: ${fmt(p.used)} / ${fmt(p.miktar)} m²`
            : "Tamamı kullanılacak";
      }

      partiRows.push({
        material,
        name: p.name || m?.name || "-",
        types: m ? [...m.types] : [],
        type: m ? join(m.types) : "-",
        parti: p.parti,
        depo: p.depo,
        stokTipi: p.stokTipi,
        en: p.en,
        uzunluk: p.uzunluk,
        miktar: p.miktar,
        used: p.used,
        dilmeEni: widths.join(", "),
        machines: join(groups.flatMap((g) => g.machines)),
        firstStart: groups.length
          ? groups.reduce((a, g) => (!a || g.firstStart < a ? g.firstStart : a), null)
          : null,
        nextStart: m?.nextStart || null,
        status,
        reason,
      });
    });
  });

  const order = { [DURUM.DEPO]: 0, [DURUM.KULLANILMAYACAK]: 1, [DURUM.KULLANILACAK]: 2 };

  partiRows.sort(
    (a, b) => order[a.status] - order[b.status] || byNo(a.material, b.material) || byNo(a.parti, b.parti)
  );

  needRows.sort((a, b) => a.firstStart - b.firstStart || byNo(a.material, b.material));

  return { partiRows, needRows, windowEnd, noDate };
}
