// Helper utilities
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
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


