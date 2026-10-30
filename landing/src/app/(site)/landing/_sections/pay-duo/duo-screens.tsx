// The iPhone Duo's screens. Like any phone UI they stay in English and LTR in
// both site languages (the device is forced dir="ltr"). Every state a scene
// needs is already in the DOM; pay-duo.css cross-fades between them with
// opacity/transform only. Decorative mockups: the device is aria-hidden + inert,
// so the "buttons" are plain spans.
import { AppleGlyph, CheckGlyph, FingerprintGlyph, LockGlyph, SignalGlyph } from "./glyphs"

export const PAY = {
  merchant: "Rummanah Store",
  product: "Everyday set",
  amount: "AED 420",
  email: "layla@example.com",
  name: "Layla Hassan",
  card: "4242 4242 4242 4242",
  expiry: "12 / 28",
  cvc: "123",
} as const

function Status({ time = true, icons = true }: { time?: boolean; icons?: boolean }) {
  return (
    <div className="d-status">
      <span className="d-time">{time ? "9:41" : ""}</span>
      {icons && SignalGlyph}
    </div>
  )
}

function Merchant() {
  return (
    <div className="d-merchant">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Rummanh_logo.png" alt="" width={64} height={64} loading="lazy" decoding="async" />
      <span>{PAY.merchant}</span>
    </div>
  )
}

function Product({ big = false }: { big?: boolean }) {
  return (
    <div className={big ? "d-prod d-prod-big" : "d-prod"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/product-thumb.webp" alt="" width={520} height={390} loading="lazy" decoding="async" />
    </div>
  )
}

const Buttons = (
  <div className="d-btns">
    <span className="d-btn d-apple">{AppleGlyph}Pay</span>
    <span className="d-btn d-link">Pay with <b>link</b></span>
  </div>
)

// Outer display (5.4", shown while folded): the order, then — on phones, where
// it carries scene 3 — three fields filling in, then a compact "Paid" receipt.
export function OuterDisplay() {
  return (
    <div className="d-screen d-outer">
      <span className="d-punch" />
      <Status />
      <div className="d-body">
        <Merchant />
        <Product />
        <div className="d-title">{PAY.product}</div>
        <div className="d-price">{PAY.amount}</div>
        <div className="d-swap">
          <div className="d-buy">
            {Buttons}
            <div className="d-or">Or pay with card</div>
          </div>
          <div className="d-oform">
            <span className="d-of" style={{ "--i": 0 } as React.CSSProperties}><i>you@example.com</i><b>{PAY.email}</b></span>
            <span className="d-of" style={{ "--i": 1 } as React.CSSProperties}><i>1234 1234 1234 1234</i><b>{PAY.card}</b><em className="d-visa">VISA</em></span>
            <span className="d-of" style={{ "--i": 2 } as React.CSSProperties}><i>MM / YY · CVC</i><b>{PAY.expiry} · {PAY.cvc}</b></span>
            <span className="d-btn d-paybtn">{LockGlyph}Pay {PAY.amount}</span>
          </div>
        </div>
      </div>
      <div className="d-paid">
        <span className="d-paid-ic">{CheckGlyph}</span>
        <b>Paid</b>
        <span className="d-paid-amt">{PAY.amount}</span>
        <span className="d-paid-m">{PAY.merchant}</span>
      </div>
    </div>
  )
}

// Inner display, left half (the leaf): the store's product page.
export function StorePane() {
  return (
    <div className="d-screen d-store">
      <Status icons={false} />
      <div className="d-body">
        <Merchant />
        <Product big />
        <div className="d-title">{PAY.product}</div>
        <div className="d-sub">Leather tote, wallet &amp; card holder</div>
        <div className="d-price">{PAY.amount}</div>
        <div className="d-note">Free delivery · Dubai</div>
      </div>
    </div>
  )
}

// Inner display, right half (the base): checkout → Apple Pay sheet (Touch ID in
// the side button) → payment complete. The crease sits between the halves, so
// nothing here crosses it.
export function PayPane() {
  return (
    <div className="d-screen d-pay">
      <Status time={false} />
      <div className="d-body">
        <div className="d-head"><b>Checkout</b><span>1 item · {PAY.amount}</span></div>
        <div className="d-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/product-thumb.webp" alt="" width={520} height={390} loading="lazy" decoding="async" />
          <span><b>{PAY.product}</b><i>Qty 1</i></span>
          <em>{PAY.amount}</em>
        </div>
        {Buttons}
        <div className="d-or">Or pay with card</div>
        <div className="d-rows">
          <span><i>Subtotal</i><b>{PAY.amount}</b></span>
          <span><i>Delivery</i><b>Free</b></span>
          <span className="d-tot"><i>Total</i><b>{PAY.amount}</b></span>
        </div>
      </div>
      <div className="d-sheet">
        <div className="d-sh-head"><span className="d-apay">{AppleGlyph}Pay</span><span className="d-cancel">Cancel</span></div>
        <div className="d-sh-card">
          <em className="d-visa">VISA</em>
          <span><b>Visa ···· 4242</b><i>{PAY.name} · Dubai, UAE</i></span>
        </div>
        <div className="d-sh-secure">{LockGlyph}<span>Powered by Stripe</span><em>3-D Secure</em></div>
        <div className="d-sh-total"><i>Pay {PAY.merchant}</i><b>{PAY.amount}</b></div>
        <div className="d-sh-confirm">
          <span className="d-touch">{FingerprintGlyph}<i>Pay with Touch ID</i></span>
          <span className="d-done">{CheckGlyph}<i>Done</i></span>
        </div>
      </div>
      <div className="d-success">
        <span className="d-badge">{CheckGlyph}</span>
        <b>Payment complete</b>
        <span className="d-amt">{PAY.amount}</span>
        <span className="d-m">{PAY.merchant}</span>
        <span className="d-proc">{LockGlyph}Processed by Stripe · 3-D Secure</span>
      </div>
    </div>
  )
}
