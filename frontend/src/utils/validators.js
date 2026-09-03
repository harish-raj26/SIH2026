export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

export function isValidPhone(phone) {
  if (!phone) return false;
  return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(String(phone).trim());
}

export function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

export function isPositiveNumber(val) {
  const num = Number(val);
  return !isNaN(num) && num > 0;
}
