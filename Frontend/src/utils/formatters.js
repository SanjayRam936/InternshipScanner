/**
 * Format an ISO timestamp to a readable date/time string.
 * e.g. "2026-07-14T10:30:00Z" -> "14 Jul 2026, 10:30"
 */
export const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Format a confidence float (0–100) to a display string.
 * e.g. 94.7 -> "94%"
 */
export const formatConfidence = (value) => {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}%`;
};

/**
 * Generate a random hex session ID for cosmetic display.
 * e.g. "0x92F4A"
 */
export const generateSessionId = () => {
  const hex = Math.floor(Math.random() * 0xFFFFF).toString(16).toUpperCase().padStart(5, '0');
  return `0x${hex}`;
};

/**
 * Generate a cosmetic ISO sensitivity string for display.
 */
export const generateIsoSensitivity = () => {
  const values = ['ISO_100', 'ISO_200', 'ISO_400', 'ISO_800'];
  return values[Math.floor(Math.random() * values.length)];
};

/**
 * Compute how many days ago a date was.
 */
export const daysAgo = (isoString) => {
  if (!isoString) return null;
  const ms = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};
