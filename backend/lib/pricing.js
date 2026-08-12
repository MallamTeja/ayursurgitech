// The only place order maths happens. Integer paise everywhere, never a float.
// SPEC.md section 2: GST is rounded per line item, then summed. Rounding once on the
// order subtotal produces a total that does not match a line-item invoice.

export function computeOrderTotals(lines, deliveryFee = 0) {
  const items = lines.map((line) => {
    const lineSubtotal = line.unitPrice * line.qty
    return { ...line, lineSubtotal, lineGst: Math.round((lineSubtotal * line.gstRate) / 100) }
  })

  const subtotal = items.reduce((sum, i) => sum + i.lineSubtotal, 0)
  const gstTotal = items.reduce((sum, i) => sum + i.lineGst, 0)

  return { items, subtotal, gstTotal, deliveryFee, grandTotal: subtotal + gstTotal + deliveryFee }
}
