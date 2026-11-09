import { useEffect } from 'react'
import { format } from 'date-fns'
import { formatCurrency, formatDate, amountInWords } from '../lib/utils'

// Printable MMS Prime sales invoice.
//
// SINGLE print: one invoice fills a whole A4 portrait page (vertical).
// BULK print: two invoices side by side on one A4 landscape page
// (each invoice is half the sheet, for bulk printing).
// The saved PDF filename comes from document.title, set at print time:
// "<Customer name> <Mobile> <Invoice date>" — e.g. "TP surgical
// 01355944866 4 November 2026". Bulk prints save as
// "MMS Prime Invoices <today>".

// Filename-safe: strip characters Windows/Chrome reject in a file name.
const safePart = (s) => String(s || '').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim()

// "4 November 2026" — the date part of the file name.
const fileDate = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return format(d, 'd MMMM yyyy')
}

const singleFileName = (invoice) => {
  const parts = [
    safePart(invoice.dealer || invoice.customerName),
    safePart(invoice.dealerPhone),
    fileDate(invoice.date),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : safePart(invoice.number || 'Invoice')
}

const ROWS_SINGLE = 16
const ROWS_BULK = 10

function InvoiceSheet({ invoice, products = [], payments = [], bulk = false }) {
  const items = Array.isArray(invoice.items) ? invoice.items : []
  const productName = (it) => {
    if (it.name) return it.name
    const p = products.find(p => String(p.id) === String(it.product_id || it.id))
    return p ? p.name : (it.sku || '')
  }
  const minRows = bulk ? ROWS_BULK : ROWS_SINGLE
  const rows = [...items]
  while (rows.length < minRows) rows.push(null)
  const paid = Number(invoice.paid) || 0
  const lastPayment = (payments || []).filter(p => p.invoice_id === invoice.id).slice(-1)[0]
  const payMethod = lastPayment?.payment_method || null
  const payRef = lastPayment?.reference_number || lastPayment?.notes || ''
  const methods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
  ]

  return (
    <div className={`invoice-sheet${bulk ? ' bulk' : ''}`}>
      {/* Header: logo (ratio preserved) + company + title */}
      <div className="inv-header">
        <img src="/mms-logo.png" alt="MMS Prime" className="inv-logo" />
        <div className="inv-company">
          <p className="inv-company-name">MMS PRIME</p>
          <p className="inv-company-sub">MEDIRON Healthcare Products · Delivering Value Everyday</p>
          <p className="inv-company-addr">23, Shahid Captain Monsur Ali Sharani (3rd Floor), Ramna, Dhaka</p>
          <p className="inv-company-addr">Contact: 01355944866, 01790606057 · mmsprime.bd · Facebook: MMS PRIME</p>
        </div>
        <div className="inv-title">
          <p className="inv-title-main">SALES INVOICE</p>
          <p className="inv-title-sub">BDT</p>
        </div>
      </div>

      {/* Bill-to + invoice meta */}
      <div className="inv-meta">
        <div className="inv-billto">
          <p className="inv-sec-label">Bill To</p>
          <p className="inv-billto-name">{invoice.dealer || invoice.customerName || '-'}</p>
          <p className="inv-line">{invoice.customerType === 'customer' ? 'Retail (walk-in)' : 'Dealer'}</p>
          <p className="inv-line">Mobile: {invoice.dealerPhone || '-'}</p>
          <p className="inv-line">Address: {invoice.dealerAddress || '-'}</p>
        </div>
        <div className="inv-meta-right">
          <div className="inv-meta-row"><span>Invoice No.</span><b>{invoice.number}</b></div>
          <div className="inv-meta-row"><span>Invoice Date</span><b>{formatDate(invoice.date)}</b></div>
          <div className="inv-meta-row"><span>Due Date</span><b>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</b></div>
          <div className="inv-meta-row"><span>Reference</span><b>{invoice.orderId ? `Order ${String(invoice.orderId).slice(0, 8)}` : '-'}</b></div>
        </div>
      </div>

      {/* Product table — rows stretch to fill the sheet */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="c-num">#</th>
              <th className="c-desc">Product Description / Model</th>
              <th className="c-qty">Qty</th>
              <th className="c-price">Unit Price</th>
              <th className="c-amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it, i) => (
              <tr key={i}>
                <td className="c-num">{String(i + 1).padStart(2, '0')}</td>
                <td className="c-desc">{it ? productName(it) : ''}</td>
                <td className="c-qty">{it ? (it.qty ?? it.quantity ?? '') : ''}</td>
                <td className="c-price">{it ? formatCurrency(it.price ?? it.unit_price ?? 0) : ''}</td>
                <td className="c-amt">{it ? formatCurrency((it.amount ?? (Number(it.qty ?? it.quantity ?? 0) * Number(it.price ?? it.unit_price ?? 0)))) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + payment details */}
      <div className="inv-bottom">
        <div className="inv-pay">
          <p className="inv-sec-label">Payment Details</p>
          <p className="inv-pay-methods">
            {methods.map(m => (
              <span key={m.value} className="inv-pay-method">
                <span className={`inv-box ${payMethod === m.value ? 'checked' : ''}`}>{payMethod === m.value ? '✓' : ''}</span>
                {m.label}
              </span>
            ))}
          </p>
          <p className="inv-line">Transaction ID / Reference: {payRef || '____________'}</p>
          {invoice.notes && <p className="inv-line">Notes: {invoice.notes}</p>}
        </div>
        <div className="inv-totals">
          <div className="inv-trow"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          <div className="inv-trow"><span>Discount ({invoice.discountPercent || 0}%)</span><span>− {formatCurrency(invoice.discountAmount)}</span></div>
          <div className="inv-trow"><span>Delivery Charge</span><span>+ {formatCurrency(invoice.deliveryCharge)}</span></div>
          <div className="inv-trow"><span>VAT ({invoice.taxPercent || 0}%)</span><span>+ {formatCurrency(invoice.vatAmount)}</span></div>
          <div className="inv-trow inv-grand"><span>Grand Total</span><span>{formatCurrency(invoice.amount)}</span></div>
          <div className="inv-trow"><span>Less: IT (TDS) ({invoice.tdsPercent || 0}%)</span><span>− {formatCurrency(invoice.tdsAmount)}</span></div>
          <div className="inv-trow inv-net"><span>Net Payable</span><span>{formatCurrency(invoice.netPayable)}</span></div>
          <div className="inv-trow"><span>Amount Paid</span><span>{formatCurrency(paid)}</span></div>
          <div className="inv-trow inv-due"><span>Balance Due</span><span>{formatCurrency(Math.max((invoice.netPayable ?? invoice.amount) - paid, 0))}</span></div>
        </div>
      </div>

      {/* Amount in words */}
      <p className="inv-words">Amount in Words: {amountInWords(invoice.netPayable ?? invoice.amount)}</p>

      {/* Signatures */}
      <div className="inv-sign">
        <div><span>Customer Signature</span></div>
        <div><span>Prepared By</span></div>
        <div><span>Authorized Signature &amp; Seal</span></div>
      </div>

      <p className="inv-footer">Thank you for choosing MMS PRIME. &nbsp;·&nbsp; mmsprime.bd &nbsp;·&nbsp; Facebook: MMS PRIME</p>
    </div>
  )
}

export default function InvoicePrint({ invoice, invoices, products = [], payments = [], onClose }) {
  const bulkList = Array.isArray(invoices) && invoices.length > 0 ? invoices : null
  const isBulk = !!bulkList
  // Bulk: two invoices per landscape page.
  const pairs = []
  if (isBulk) {
    for (let i = 0; i < bulkList.length; i += 2) pairs.push(bulkList.slice(i, i + 2))
  }

  // Chrome uses document.title as the default "Save as PDF" file name.
  // Set it at print time and restore it right after the dialog closes.
  const handlePrint = () => {
    const prevTitle = document.title
    document.title = isBulk
      ? `MMS Prime Invoices ${format(new Date(), 'd MMMM yyyy')}`
      : singleFileName(invoice)
    const restore = () => {
      document.title = prevTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  // Safety net: if the user prints with Ctrl+P / the browser menu instead
  // of the Print button, the title is still the invoice name.
  useEffect(() => {
    const prevTitle = document.title
    document.title = isBulk
      ? `MMS Prime Invoices ${format(new Date(), 'd MMMM yyyy')}`
      : singleFileName(invoice)
    return () => { document.title = prevTitle }
  }, [isBulk, invoice, invoices])

  return (
    <div className={`invoice-print-page${isBulk ? ' bulk' : ' single'}`}>
      {/* Screen-only toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">
          {isBulk
            ? `Print preview — bulk · ${bulkList.length} invoices · 2 per A4 landscape page`
            : `Print preview — full A4 · ${invoice.number}`}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary">Back to invoices</button>
          <button onClick={handlePrint} className="btn-primary">Print</button>
        </div>
      </div>

      {isBulk ? (
        pairs.map((pair, pi) => (
          <div key={pi} className="bulk-page">
            {pair.map((inv) => (
              <InvoiceSheet key={inv.id} invoice={inv} products={products} payments={payments} bulk />
            ))}
            {pair.length === 1 && <div className="invoice-sheet bulk bulk-empty" aria-hidden="true" />}
          </div>
        ))
      ) : (
        <InvoiceSheet invoice={invoice} products={products} payments={payments} />
      )}
    </div>
  )
}
