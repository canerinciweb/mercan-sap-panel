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

  const stockMap = new Map();

  zparti.forEach((item) => {
    stockMap.set(item.material, item);
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

    current.need += item.need;
    current.machines.add(item.machine);

    if (item.jobOrder) {
      current.jobOrders.add(item.jobOrder);
    }
  });

  return [...grouped.values()]
    .map((item) => {
      const stock = stockMap.get(item.material)?.stock || 0;

      const remaining = stock - item.need;

      let action = "Kullanılacak";

      if (remaining < 0) action = "Kritik";
      else if (remaining > item.need) action = "Depoya Gönder";

      return {
        ...item,
        stock,
        remaining,
        machines: [...item.machines].join(", "),
        jobOrders: [...item.jobOrders].join(", "),
        action,
      };
    })
    .sort((a, b) => b.remaining - a.remaining);
}