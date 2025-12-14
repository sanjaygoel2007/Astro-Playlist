// backend/dasha/utils.js

export function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function formatDate(date) {
  return date.toISOString().split("T")[0];
}
