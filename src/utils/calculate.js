function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === "number") {
    return new Date((value - 25569) * 86400 * 1000);
  }

  const text = String(value).trim();

  // DD.MM.YYYY
  const tr = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (tr) {
    return new Date(tr[3], tr[2] - 1, tr[1]);
  }

  const d = new Date(text);
  return isNaN(d) ? null : d;
}

export function mergeData(zparti, zpp) {
  const usableMap = new Map();

  zparti.forEach((item) => usableMap.set(item.material, item));

  const grouped = new Map();

  zpp.forEach((item) => {
    const start = parseDate(item.startDate);

    if (!grouped.has(item.material)) {
      grouped.set(item.material, {
        material: item.material,
        name: item.name,
        type: item.type,
        need: 0,
        machines: new Set(),
        jobOrders: new Set(),
        earliestDate: start,
      });
    }

    const current = grouped.get(item.material);

    current.need += Number(item.need || 0);
    current.machines.add(item.machine);

    if (item.jobOrder) current.jobOrders.add(item.jobOrder);

    if (
      start &&
      (!current.earliestDate || start < current.earliestDate)
    ) {
      current.earliestDate = start;
    }
  });

  const result = [];

  grouped.forEach((item) => {
    const usable = usableMap.get(item.material)?.usable || 0;
    const remaining = usable - item.need;

    let action = "Kullanılacak";

    if (item.need === 0) action = "Depoya Gönder";
    else if (remaining < 0) action = "Kritik";
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
      startDate: item.earliestDate,
      action,
    });

    usableMap.delete(item.material);
  });

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
      startDate: null,
      action: "Depoya Gönder",
    });
  });

  return result.sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return a.startDate - b.startDate;
  });
}