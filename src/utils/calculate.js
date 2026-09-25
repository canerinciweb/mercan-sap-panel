/* =========================================================
   AYARLAR
========================================================= */
 
/* Parti eni (ZPARTİ H) ile TopDlmEni (ZPP022 N) toleransı, cm */
export const TOL_ALT = 1; // parti en fazla 1 cm dar olabilir
export const TOL_UST = 3; // parti en fazla 3 cm geniş olabilir
 
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
const uniq = (list) => [...new Set(list)].filter((x) => x !== "" && x != null);
const join = (list) => uniq(list).join(", ");
const fmt = (n) => Number(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const fmtDate = (d) =>
  d ? d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "-";
const minDate = (dates) =>
  dates.filter(Boolean).reduce((a, d) => (!a || d < a ? d : a), null);
 
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
 
  İHTİYAÇ
  Plan başlangıcı (refDate + days) anından önce olan ve Pl.kalan > 0 olan
  her ZPP022 satırı bir ihtiyaç satırıdır (hat + iş emri + TopDlmEni).
  Geciken işler de dahildir.
 
  DAĞITIM
  Satırlar malzeme + TopDlmEni bazında gruplanır. Gruplar ve grup içindeki
  satırlar en erken başlayandan başlanarak karşılanır. Her satır, eni
  tolerans içinde olan TAHDITSZ partilerden parti no sırasıyla düşer.
  Hangi partinin hangi HAT ve İŞ EMRİNE gittiği satır bazında kaydedilir.
 
  PARTİ DURUMU
  Depoya Gönder   : Seçilen sürede bu malzemenin hiç ihtiyacı yok
  Kullanılmayacak : İhtiyaç var ama bu parti kullanılmıyor
                    (en uyumsuz / ihtiyaç diğer partilerle karşılanıyor / bloke)
  Kullanılacak    : Partinin tamamı ya da bir kısmı tüketilecek
 
  PARTİNİN HATLARI
  Kullanılacak    : sadece partinin gerçekten gideceği hatlar
  Kullanılmayacak : partinin eninin uyduğu işlerin hatları
                    (en hiçbir işe uymuyorsa malzemenin tüm hatları)
  Depoya Gönder   : hat yok
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
      m.groups.set(width, { width, lines: [], types: new Set() });
    }
 
    const g = m.groups.get(width);
    g.types.add(it.type);
    g.lines.push({
      machine: it.machine,
      jobOrder: it.jobOrder,
      start: it.start,
      need: it.plKalan,
      left: it.plKalan,
    });
  });
 
  mats.forEach((m) =>
    m.groups.forEach((g) => {
      g.lines.sort((a, b) => a.start - b.start);
      g.firstStart = g.lines[0]?.start || null;
      g.need = g.lines.reduce((s, l) => s + l.need, 0);
      g.machines = uniq(g.lines.map((l) => l.machine));
    })
  );
 
  /* ---------- 2) Stok ----------
     Rulo malzemeler (En > 0) ile planda geçen malzemeler alınır.
     Su, boya, yapıştırıcı gibi En'i olmayan kalemler raporlanmaz. */
  const partiMap = new Map();
 
  zparti.forEach((p) => {
    if (!(p.en > 0) && !mats.has(p.material)) return;
    if (!partiMap.has(p.material)) partiMap.set(p.material, []);
 
    partiMap.get(p.material).push({
      ...p,
      left: p.miktar,
      used: 0,
      fitGroups: [],   // eninin uyduğu işler
      served: [],      // gerçekten gittiği satırlar { width, machine, jobOrder, start, amount }
    });
  });
 
  partiMap.forEach((list) => list.sort((a, b) => byNo(a.parti, b.parti)));
 
  /* ---------- 3) Dağıtım ---------- */
  const needRows = [];
 
  mats.forEach((m, material) => {
    const partiler = partiMap.get(material) || [];
    const groups = [...m.groups.values()].sort((a, b) => a.firstStart - b.firstStart);
 
    groups.forEach((g) => {
      const uygun = partiler.filter((p) => enUygun(p.en, g.width));
      uygun.forEach((p) => p.fitGroups.push(g));
 
      const kullanilabilir = uygun.filter(isUsableStock);
 
      g.lines.forEach((line) => {
        for (const p of kullanilabilir) {
          if (line.left <= EPS) break;
          if (p.left <= EPS) continue;
 
          const take = Math.min(p.left, line.left);
          p.left -= take;
          p.used += take;
          line.left -= take;
 
          p.served.push({
            width: g.width,
            machine: line.machine,
            jobOrder: line.jobOrder,
            start: line.start,
            amount: take,
          });
        }
      });
 
      const missing = g.lines.reduce((s, l) => s + Math.max(l.left, 0), 0);
      const covered = g.need - missing;
 
      /* Karşılanamayan satırların hatları (hat filtresinde eksik görünsün) */
      const missingMachines = uniq(g.lines.filter((l) => l.left > EPS).map((l) => l.machine));
 
      needRows.push({
        material,
        name: m.name || "-",
        types: [...g.types],
        type: join(g.types),
        dilmeEni: g.width,
        firstStart: g.firstStart,
        machines: g.machines.join(", "),
        missingMachines: missingMachines.join(", "),
        jobCount: uniq(g.lines.map((l) => l.jobOrder)).length,
        need: g.need,
        fittingStock: kullanilabilir.reduce((s, p) => s + p.miktar, 0),
        fittingCount: kullanilabilir.length,
        covered,
        missing,
        status: !partiler.length
          ? "Stokta yok"
          : missing > EPS
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
    const allWidths = groups.map((g) => g.width).filter(Boolean).sort((a, b) => a - b);
    const allMachines = uniq(groups.flatMap((g) => g.machines));
 
    partiler.forEach((p) => {
      const fitWidths = uniq(p.fitGroups.map((g) => g.width)).sort((a, b) => a - b);
      const fitMachines = uniq(p.fitGroups.flatMap((g) => g.machines));
      const servedWidths = uniq(p.served.map((s) => s.width)).sort((a, b) => a - b);
      const servedMachines = uniq(p.served.map((s) => s.machine));
 
      let status;
      let reason;
      let machines = [];
      let dilmeEni = fitWidths.length ? fitWidths : allWidths;
 
      if (!hasNeed) {
        status = DURUM.DEPO;
        reason = m?.nextStart
          ? `${days} gün içinde ihtiyaç yok. Sonraki iş: ${fmtDate(m.nextStart)}`
          : m
          ? "Planda kalan ihtiyaç yok"
          : "İş planında (ZPP022) yok";
      } else if (!fitWidths.length) {
        status = DURUM.KULLANILMAYACAK;
        reason = `En uyumsuz: parti ${fmt(p.en)} cm, işler ${allWidths.map(fmt).join(" / ")} cm`;
        machines = allMachines;
      } else if (!isUsableStock(p)) {
        status = DURUM.KULLANILMAYACAK;
        reason = `Stok tipi ${p.stokTipi || "belirsiz"}, üretimde kullanılamaz`;
        machines = fitMachines;
      } else if (p.used <= EPS) {
        status = DURUM.KULLANILMAYACAK;
        reason = `${fitWidths.map(fmt).join(" / ")} cm işe uyuyor, ihtiyaç önceki partilerle karşılanıyor`;
        machines = fitMachines;
      } else {
        status = DURUM.KULLANILACAK;
        machines = servedMachines;
        dilmeEni = servedWidths;
 
        const fire = fmt(p.en - Math.max(...servedWidths));
        const base = `${servedWidths.map(fmt).join(" / ")} cm işe, ${fire} cm fire`;
 
        reason =
          p.left > EPS
            ? `${base}. Kısmen: ${fmt(p.used)} / ${fmt(p.miktar)} m²`
            : `${base}. Tamamı kullanılacak`;
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
        dilmeEni: dilmeEni.join(", "),
        machines: machines.join(", "),
        jobOrders: join(p.served.map((s) => s.jobOrder)),
        firstStart:
          status === DURUM.KULLANILACAK
            ? minDate(p.served.map((s) => s.start))
            : minDate(groups.map((g) => g.firstStart)),
        nextStart: m?.nextStart || null,
        status,
        reason,
      });
    });
  });
 
  const order = { [DURUM.DEPO]: 0, [DURUM.KULLANILMAYACAK]: 1, [DURUM.KULLANILACAK]: 2 };
 
  partiRows.sort(
    (a, b) =>
      order[a.status] - order[b.status] || byNo(a.material, b.material) || byNo(a.parti, b.parti)
  );
 
  needRows.sort((a, b) => a.firstStart - b.firstStart || byNo(a.material, b.material));
 
  return { partiRows, needRows, windowEnd, noDate };
}
 