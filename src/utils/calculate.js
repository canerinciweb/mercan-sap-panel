function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === "number") {
    return new Date((value - 25569) * 86400 * 1000);
  }

  const d = new Date(value);

  return isNaN(d) ? null : d;
}

export function mergeData(zparti, zpp) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + 3);

  const usableMap = new Map();

  zparti.forEach((item) => {
    usableMap.set(item.material, item);
  });

  const grouped = new Map();

  zpp.forEach((item) => {
    const start = parseDate(item.startDate);

    if (!start) return;

    start.setHours(0, 0, 0, 0);

    if (start < today || start > limit) return;

    if (!grouped.has(item.material)) {
      grouped.set(item.material, {
        material: item.material,
        name: item.name,
        type: item.type,
        need: 0,
        machines: new Set(),
        jobOrders: new Set(),
      });
    }

    const current = grouped.get(item.material);

    current.need += Number(item.need || 0);

    current.machines.add(item.machine);

    if (item.jobOrder) current.jobOrders.add(item.jobOrder);
  });

  const result = [];

  grouped.forEach((item) => {
    const usable = usableMap.get(item.material)?.usable || 0;

    const remaining = usable - item.need;

    let action = "Kullanılacak";

    if (remaining < 0) action = "Kritik";
    else if (remaining > 0) action = "Depoya Gönder";

    result.push({
      material: item.material,
      name: item.name,
      type: item.type,
      usable,
      stock: usable,
      need: item.need,
      remaining,
      machines: [...item.machines].join(", "),
      jobOrders: [...item.jobOrders].join(", "),
      action,
    });

    usableMap.delete(item.material);
  });

  // ZPARTİ'de olup ZPP'de olmayanlar
  usableMap.forEach((item) => {
    result.push({
      material: item.material,
      name: item.name,
      type: "Silikon",
      usable: item.usable,
      stock: item.usable,
      need: 0,
      remaining: item.usable,
      machines: "-",
      jobOrders: "-",
      action: "Depoya Gönder",
    });
  });

  return result.sort((a, b) => b.remaining - a.remaining);
}