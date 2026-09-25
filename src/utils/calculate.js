const DAY = 86400000;
const EPS = 0.001; // çok küçük farklar yok sayılır

/* ===========================
   DİLME ENİ TOLERANSI
   Parti eni, TopDlmEni'nin 2 cm altı ile 3 cm üstü arasında olmalı.
   En ve TopDlmEni mm ise 20 / 30, cm ise 2 / 3 yaz.
=========================== */
export const TOL_ALT = 20;
export const TOL_UST = 30;

const byNo = (a, b) => String(a).localeCompare(String(b), "tr", { numeric: true });
const join = (values) => [...new Set(values)].filter(Boolean).join(", ");

/* Dilme eni okunamadıysa (0) en kontrolü yapılmaz */
export function enUygun(partiEn, dilmeEni) {
  if (!dilmeEni) return true;
  return partiEn >= dilmeEni - TOL_ALT && partiEn <= dilmeEni + TOL_UST;
}

/*
  zparti : parseZparti() çıktısı
  zpp    : parseZpp() çıktısı (sadece U/A/F/G)
  days   : seçilen gün
  Kural  : başlangıcı (şimdi + gün) anından önce olan ve PL kalanı > 0 olan
           her iş ihtiyaçtır. Geciken işler de dahildir.
*/
export function mergeData(zparti, zpp, days, refDate = new Date()) {
  const windowEnd = new Date(refDate.getTime() + days * DAY);

  /* ---------- 1) İhtiyaç: malzeme -> dilme eni grupları ---------- */
  const matMap = new Map();

  zpp.forEach((item) => {
    if (!matMap.has(item.material)) {
      matMap.set(item.material, {
        name: item.name,
        types: new Set(),
        need: 0,
        nextStart: null,
        groups: new Map(),
      });
    }

    const m = matMap.get(item.material);
    if (!m.name && item.name) m.name = item.name;
    m.types.add(item.type);

    if (!item.start || !(item.need > EPS)) return;

    if (item.start > windowEnd) {
      if (!m.nextStart || item.start < m.nextStart) m.nextStart = item.start;
      return;
    }

    m.need += item.need;

    const width = Number(item.dilmeEni) || 0;
    if (!m.groups.has(width)) {
      m.groups.set(width, {
        width,
        need: 0,
        left: 0,
        firstStart: null,
        machines: [],
        jobOrders: [],
      });
    }

    const g = m.groups.get(width);
    g.need += item.need;
    g.machines.push(item.machine);
    g.jobOrders.push(item.jobOrder);
    if (!g.firstStart || item.start < g.firstStart) g.firstStart = item.start;
  });

  /* ---------- 2) Stok: malzeme -> partiler ---------- */
  const partiMap = new Map();

  zparti.forEach((p) => {
    if (!partiMap.has(p.material)) partiMap.set(p.material, []);
    partiMap.get(p.material).push(p);
  });

  /* ---------- 3) Dağıtım ----------
     Gruplar en erken başlayan işten başlanarak karşılanır.
     Her grup, eni tolerans içinde olan partilerden parti no sırasıyla tüketir.
     Bir partinin kalan metrajı birden fazla gruba bölünebilir. */
  const result = [];

  matMap.forEach((m, material) => {
    const groups = [...m.groups.values()].sort((a, b) => a.firstStart - b.firstStart);

    const partiler = (partiMap.get(material) || [])
      .slice()
      .sort((a, b) => byNo(a.parti, b.parti))
      .map((p) => ({ ...p, left: p.alan, used: 0, fits: false, served: [] }));

    groups.forEach((g) => {
      g.left = g.need;

      partiler.forEach((p) => {
        if (!enUygun(p.en, g.width)) return;
        p.fits = true;

        if (g.left <= EPS || p.left <= EPS) return;

        const take = Math.min(p.left, g.left);
        p.left -= take;
        p.used += take;
        g.left -= take;
        p.served.push(g);
      });
    });

    const allWidths = groups.map((g) => g.width).filter(Boolean).sort((a, b) => a - b);
    const allMachines = join(groups.flatMap((g) => g.machines));
    const allJobs = join(groups.flatMap((g) => g.jobOrders));

    /* ---------- 4) Parti satırları ---------- */
    partiler.forEach((p) => {
      let action;
      let reason = "";

      if (m.need <= EPS) {
        action = "Depoya Gönder";
        reason = "Planda yok";
      } else if (!p.fits) {
        action = "Depoya Gönder";
        reason = "En uyumsuz";
      } else if (p.used <= EPS) {
        action = "Depoya Gönder";
        reason = "Fazla stok";
      } else if (p.served.some((g) => g.left > EPS)) {
        action = "Kritik";
      } else if (p.left > EPS) {
        action = "Kısmi";
      } else {
        action = "Kullanılacak";
      }

      const src = p.served.length ? p.served : groups;

      result.push({
        material,
        name: p.name || m.name || "-",
        type: join(m.types),
        parti: p.parti,
        depo: p.depo,
        en: p.en,
        uzunluk: p.uzunluk,
        usable: p.alan,
        stock: p.alan,
        used: p.used,
        remaining: p.left,
        missing: 0,
        need: m.need,
        dilmeEni: p.served.length ? join(p.served.map((g) => g.width)) : allWidths.join(", "),
        machines: p.served.length ? join(src.flatMap((g) => g.machines)) : allMachines,
        jobOrders: p.served.length ? join(src.flatMap((g) => g.jobOrders)) : allJobs,
        startDate: src[0]?.firstStart || null,
        nextDate: m.nextStart,
        action,
        reason,
      });
    });

    /* ---------- 5) Karşılanamayan ihtiyaçlar ----------
       ZPARTİ'de hiç partisi olmayan malzeme -> Depoya Gönder
       Partisi var ama yetmiyor / en uymuyor -> Kritik */
    const inZparti = partiler.length > 0;

    groups.forEach((g) => {
      if (g.left <= EPS) return;

      const action = inZparti ? "Kritik" : "Depoya Gönder";
      const reason = !inZparti
        ? "ZPARTİ'de yok"
        : g.need - g.left > EPS
        ? "Eksik miktar"
        : "Uygun parti yok";

      result.push({
        material,
        name: m.name || "-",
        type: join(m.types),
        parti: "-",
        depo: "-",
        en: 0,
        uzunluk: 0,
        usable: 0,
        stock: 0,
        used: 0,
        remaining: -g.left,
        missing: g.left,
        need: m.need,
        dilmeEni: String(g.width || "-"),
        machines: join(g.machines),
        jobOrders: join(g.jobOrders),
        startDate: g.firstStart,
        nextDate: m.nextStart,
        action,
        reason,
      });
    });
  });

  return result.sort(
    (a, b) =>
      byNo(a.material, b.material) ||
      (a.parti === "-") - (b.parti === "-") ||
      byNo(a.parti, b.parti)
  );
}
