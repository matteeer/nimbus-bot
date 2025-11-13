// utils/duration.js
const UNITS = { s:1e3, m:6e4, h:36e5, d:864e5, w:6048e5 };

export function parseDuration(input) {
  if (!input || typeof input !== 'string') return null;
  const re = /(\d+)\s*([smhdw])/gi;
  let m, total = 0, parts = [];
  while ((m = re.exec(input)) !== null) {
    const val = Number(m[1]), unit = m[2].toLowerCase(), mult = UNITS[unit];
    if (!mult || isNaN(val)) return null;
    total += val * mult; parts.push({ val, unit });
  }
  if (total <= 0) return null;
  const map = { s:'s', m:'m', h:'h', d:'g', w:'sett' };
  return { ms: total, pretty: parts.map(p => `${p.val}${map[p.unit]}`).join(' ') };
}

