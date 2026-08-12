// Money is integer paise everywhere. This is the only file that produces a rupee string.

/** 24000 -> "₹240.00" */
export function formatINR(paise) {
  const rupees = (Number(paise) || 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 24050 -> "240.5", for putting a stored amount back into an admin <input value>.
 * formatINR's output must never reach an input — "₹240.50" is not a number a form can post
 * back. Three admin files each grew their own `/ 100` for want of this, which is how the
 * fourth one eventually divides something that was already rupees.
 */
export const paiseToRupees = (paise) => String((Number(paise) || 0) / 100);

/** "240.50" -> 24050. Admin forms type rupees; this is the multiply-by-100 on submit. */
export function rupeesToPaise(str) {
  const rupees = parseFloat(String(str).replace(/[^\d.]/g, ''));
  return Number.isFinite(rupees) ? Math.round(rupees * 100) : 0;
}
