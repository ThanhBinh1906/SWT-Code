export function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shortDate(value) {
  return value ? value.slice(0, 10) : "";
}

export function shortDateTime(value) {
  return value ? value.slice(0, 19).replace("T", " ") : "";
}
