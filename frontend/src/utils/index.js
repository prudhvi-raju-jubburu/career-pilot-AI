// Helper utilities
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats date values cleanly into e.g. "13 Nov 2026" or "Rolling Applications".
 */
export const formatDateDisplay = (dateVal) => {
  if (!dateVal || dateVal === 'Deadline not specified' || dateVal === 'Rolling Applications') {
    return 'Rolling Applications';
  }
  if (typeof dateVal === 'object' && dateVal !== null) {
    dateVal = dateVal.$date || dateVal.date || dateVal.value || String(dateVal);
  }
  const s = String(dateVal).trim();
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(s)) return s;

  try {
    const datePart = s.split('T')[0].split(' ')[0].trim();
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (mIdx >= 0 && mIdx < 12 && day >= 1 && day <= 31) {
        return `${day} ${MONTHS_SHORT[mIdx]} ${year}`;
      }
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch {}
  return s.split('T')[0].split(' ')[0] || 'Rolling Applications';
};

/**
 * Safely strips HTML tags, decodes common entities, and removes excess whitespace.
 */
export const stripHtml = (input) => {
  if (!input) return '';
  if (typeof input !== 'string') return String(input);
  let text = input;

  // Unescape entity tags if double-escaped
  if (text.includes('&lt;') && text.includes('&gt;')) {
    text = text
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, '&');
  }

  // Replace block/line-break tags with space so words don't collide
  text = text
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|td)>/gi, ' ')
    .replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&middot;/gi, '·')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&#[0-9]+;/g, ' ');

  return text.replace(/\s+/g, ' ').trim();
};

/**
 * Robust compensation formatter:
 * - Full-time jobs (INR >= 1,00,000): e.g. "₹8 – ₹11 LPA" (never confusing "/mo" for annual CTC)
 * - Internships (INR < 1,00,000): e.g. "₹10,000/mo"
 * - USD/foreign: e.g. "$60,000 – $95,000/yr" with sanity check for bogus valuations
 */
export const formatCompensation = (opp) => {
  if (!opp) return 'Competitive Salary';
  const isInternship = String(opp.type || '').toLowerCase().includes('intern');
  const comp = opp.compensation || {};
  let rawStr = String(opp.compensationString || '').trim();

  // Extract currency symbol
  const hasUsd = rawStr.includes('$') || comp.currency === 'USD';
  const symbol = hasUsd ? '$' : '₹';

  // Extract numeric min and max
  let min = comp.min_amount != null ? Number(comp.min_amount) : (comp.min != null ? Number(comp.min) : null);
  let max = comp.max_amount != null ? Number(comp.max_amount) : (comp.max != null ? Number(comp.max) : null);

  // If min/max are missing from comp object, parse numbers from rawStr
  if (min == null && max == null && rawStr && rawStr !== 'Not specified' && rawStr !== 'Unpaid') {
    const cleanNumbers = rawStr.match(/[\d,]+/g);
    if (cleanNumbers && cleanNumbers.length > 0) {
      const parsed = cleanNumbers.map((n) => parseInt(n.replace(/,/g, ''), 10)).filter((n) => !isNaN(n) && n > 0);
      if (parsed.length === 1) {
        min = parsed[0];
      } else if (parsed.length >= 2) {
        min = parsed[0];
        max = parsed[1];
      }
    }
  }

  // Normalize min <= max
  if (min != null && max != null && min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }

  // Foreign currency (USD)
  if (symbol === '$' || comp.currency === 'USD') {
    // Detect absurd parsed numbers from company valuation/funding
    if ((min && min > 500000) || (max && max > 500000)) {
      return isInternship ? '$2,500 – $4,500/mo (Est.)' : '$60,000 – $120,000/yr (Est.)';
    }
    if (min && max) {
      return min === max ? `$${min.toLocaleString()}/yr` : `$${min.toLocaleString()} – $${max.toLocaleString()}/yr`;
    }
    if (min) return `$${min.toLocaleString()}/yr`;
    if (max) return `Up to $${max.toLocaleString()}/yr`;
    return isInternship ? '$3,000/mo (Est.)' : '$75,000 – $110,000/yr (Est.)';
  }

  // INR (₹)
  if (min != null || max != null) {
    const lowerVal = min != null ? min : max;
    const upperVal = max != null ? max : min;

    if (!isInternship) {
      // Full-time Job: Standard Indian LPA representation if >= 1 Lakh
      if (lowerVal >= 100000) {
        const minLpa = (lowerVal / 100000).toFixed(1).replace('.0', '');
        const maxLpa = (upperVal / 100000).toFixed(1).replace('.0', '');
        if (minLpa === maxLpa) {
          return `₹${minLpa} LPA`;
        }
        return `₹${minLpa} – ₹${maxLpa} LPA`;
      }
      // If monthly pay specified under 1 Lakh
      if (lowerVal > 0) {
        if (lowerVal === upperVal) return `₹${lowerVal.toLocaleString('en-IN')}/mo`;
        return `₹${lowerVal.toLocaleString('en-IN')} – ₹${upperVal.toLocaleString('en-IN')}/mo`;
      }
    } else {
      // Internship (Stipend)
      if (lowerVal < 100000) {
        if (lowerVal === upperVal) return `₹${lowerVal.toLocaleString('en-IN')}/mo`;
        return `₹${lowerVal.toLocaleString('en-IN')} – ₹${upperVal.toLocaleString('en-IN')}/mo`;
      }
      // Annual or cumulative internship stipend
      const minLpa = (lowerVal / 100000).toFixed(1).replace('.0', '');
      const maxLpa = (upperVal / 100000).toFixed(1).replace('.0', '');
      if (minLpa === maxLpa) return `₹${minLpa} LPA`;
      return `₹${minLpa} – ₹${maxLpa} LPA`;
    }
  }

  // Clean raw string fallback if available and sensible
  if (rawStr && rawStr !== 'Not specified') {
    if (rawStr.toLowerCase().includes('unpaid')) return 'Unpaid';
    return rawStr;
  }

  return isInternship ? '₹20,000 – ₹35,000/mo (Est.)' : '₹8.0 – ₹16.0 LPA (Est.)';
};

export const formatOpportunityLocation = (opp) => {
  if (!opp) return 'India / Remote';
  if (typeof opp === 'string') return opp;
  if (typeof opp.locationString === 'string' && opp.locationString.trim()) {
    return opp.locationString;
  }
  const loc = opp.location !== undefined ? opp.location : opp;
  if (!loc) return opp.workMode === 'Remote' ? 'Remote (India)' : 'India';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    if (loc.raw) return loc.raw;
    const parts = [];
    if (loc.city) parts.push(loc.city);
    if (loc.state && loc.state !== loc.city) parts.push(loc.state);
    if (loc.country) parts.push(loc.country);
    if (parts.length > 0) return parts.join(', ');
    if (loc.is_remote) return 'Remote (India)';
  }
  return 'India / Remote';
};

/**
 * Safely extracts a primitive string/number from fields that may be plain values,
 * or wrapped objects like { value: "...", confidence: 1.0, source: "manual" }.
 */
export const getSafeFieldValue = (field, fallback = '') => {
  if (field === null || field === undefined) return fallback;
  if (typeof field === 'string') return field.trim();
  if (typeof field === 'number') return field;
  if (typeof field === 'boolean') return field;
  if (typeof field === 'object') {
    // If it's a wrapper like { value: "...", confidence: 1.0, source: "manual" }
    if ('value' in field && field.value !== undefined && field.value !== null) {
      return getSafeFieldValue(field.value, fallback);
    }
    // If it's an object with a name property like { name: "React" }
    if ('name' in field && field.name !== undefined && field.name !== null) {
      return getSafeFieldValue(field.name, fallback);
    }
    // If it's an array, take the first safe value
    if (Array.isArray(field)) {
      if (field.length === 0) return fallback;
      return getSafeFieldValue(field[0], fallback);
    }
    return fallback;
  }
  return String(field);
};

/**
 * Safely extracts an array of primitive strings from an array of wrapped objects or strings.
 */
export const getSafeArrayValues = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => getSafeFieldValue(item, ''))
    .filter((v) => typeof v === 'string' && v.length > 0);
};


