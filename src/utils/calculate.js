const DAY = 86400000;
const EPS = 0.01;
const byNo = (a, b) => a.localeCompare(b, "tr", { numeric: true });

export function mergeData(zparti, zpp, days, refDate = new Date()) {
  const windowEnd = new Date(refDate.getTime() + days * DAY);

  /* ZPP022: malzeme bazında ihtiyaç */
  const needMap = new Map();

  zpp.forEach((item) => {
    if (!needMap.has(item.material)) {
      needMap.set(item.material, {
        name: item.name,
        need: 0,
        types: new Set(),
        machines: new Set(),
        jobOrders: new Set(),
        firstStart: null,
        nextStart: null,
      });
    }

    const m = needMap.get(item.material);
    m.types.add(item.type);

    if (!item.start || item.need <= 0) return;

    if (item.start <= windowEnd) {
      m.need += item.need;
      if (item.machine) m.machines.add(item.machine);
      if (item.jobOrder) m.jobOrders.add(item.jobOrder);
      if (!m.firstStart || item.start < m.firstStart) m.firstStart = item.start;
    } else if (!m.nextStart || item.start < m.nextStart) {
      m.nextStart = item.start;
    }
  });

  /* ZPARTİ: partileri malzemeye göre grupla */
  const partiMap = new Map();

  zparti.forEach((p) => {
    if (!partiMap.has(p.material)) partiMap.set(p.material, []);
    partiMap.get(p.material).push(p);
  });

  const result = [];

  partiMap.forEach((partiler, material) => {
    const m = needMap.get(material);
    if (!m) return; // ZPP022'de U/A/F/G olarak hiç geçmiyor -> üst/alt kağıt değil

    const materialStock = partiler.reduce((s, p) => s + p.alan, 0);
    let left = m.need;

    partiler.sort((a, b) => byNo(a.parti, b.parti)).forEach((p) => {
      const used = Math.min(p.alan, Math.max(left, 0));
      left -= used;

      let action, reason = "";
      if (m.need <= EPS) { action = "Depoya Gönder"; reason = "Planda yok"; }
      else if (materialStock < m.need - EPS) action = "Kritik";
      else if (used <= EPS) { action = "Depoya Gönder"; reason = "Fazla stok"; }
      else if (p.alan - used > EPS) action = "Kısmi";
      else action = "Kullanılacak";

      result.push({
        material,
        name: p.name || m.name || "-",
        type: [...m.types].join(", "),
        parti: p.parti,
        depo: p.depo,
        en: p.en,
        uzunluk: p.uzunluk,
        usable: p.alan,           // partinin m²'si
        need: m.need,             // malzemenin toplam ihtiyacı
        materialStock,
        used,
        remaining: p.alan - used, // partide boşta kalan
        machines: [...m.machines].join(", "),
        jobOrders: [...m.jobOrders].join(", "),
        startDate: m.firstStart,
        nextDate: m.nextStart,
        action,
        reason,
      });
    });
  });

  return result.sort((a, b) => byNo(a.material, b.material) || byNo(a.parti, b.parti));
}