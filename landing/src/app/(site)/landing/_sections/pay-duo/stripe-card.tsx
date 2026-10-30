// The desktop Stripe Checkout card — how a real Stripe Checkout page for
// Rummanah looks: order summary beside the payment form, Rummanah pomegranate
// as the merchant brand colour, a UAE address (Emirate, no postcode), card marks
// and "Powered by Stripe". English, LTR. Every field holds its placeholder AND
// its value; scene 3 cross-fades them in turn (pay-duo.css), so nothing is typed
// by JS. Decorative (inside the aria-hidden, inert visual): spans, not buttons.
import { AppleGlyph, CheckGlyph, LockGlyph, MastercardMark } from "./glyphs"
import { PAY } from "./duo-screens"

// `i` is the field's place in the scene-3 fill order (180 ms apart).
function Field({ i, ph, value, select, extra }: { i: number; ph: string; value: string; select?: boolean; extra?: React.ReactNode }) {
  return (
    <span className={select ? "rmn-spay-f is-select" : "rmn-spay-f"} style={{ "--i": i } as React.CSSProperties}>
      <i>{ph}</i><b>{value}</b>{extra}
    </span>
  )
}

export function StripeCard() {
  return (
    <div className="rmn-spay-card">
      <div className="rmn-spay-sum">
        <div className="rmn-spay-merchant">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Rummanh_logo.png" alt="" width={64} height={64} loading="lazy" decoding="async" />
          <span>{PAY.merchant}</span>
        </div>
        <div className="rmn-spay-lead"><span>Pay {PAY.merchant}</span><b>{PAY.amount}</b></div>
        <div className="rmn-spay-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/product-thumb.webp" alt="" width={520} height={390} loading="lazy" decoding="async" />
        </div>
        <div className="rmn-spay-item"><span>{PAY.product}</span><b>{PAY.amount}</b></div>
        <div className="rmn-spay-rows">
          <span><i>Subtotal</i><b>{PAY.amount}</b></span>
          <span><i>Shipping</i><b>Free</b></span>
          <span className="tot"><i>Total due</i><b>{PAY.amount}</b></span>
        </div>
      </div>

      <div className="rmn-spay-pay">
        <div className="rmn-spay-form">
          <div className="rmn-spay-express">
            <span className="x-apple">{AppleGlyph}Pay</span>
            <span className="x-link">Pay with <b>link</b></span>
          </div>
          <div className="rmn-spay-or"><span>Or pay with card</span></div>
          <div className="rmn-spay-g"><span className="lab">Email</span>
            <span className="rmn-spay-box"><Field i={0} ph="you@example.com" value={PAY.email} /></span>
          </div>
          <div className="rmn-spay-g"><span className="lab">Shipping address</span>
            <span className="rmn-spay-box">
              <span className="rmn-spay-f is-select is-set"><b>United Arab Emirates</b></span>
              <Field i={1} ph="Full name" value={PAY.name} />
              <Field i={2} ph="Address" value="Marina Walk, Dubai Marina" />
              <span className="rmn-spay-split">
                <Field i={3} ph="City" value="Dubai" />
                <Field i={4} ph="Emirate" value="Dubai" select />
              </span>
            </span>
          </div>
          <div className="rmn-spay-g"><span className="lab">Card information</span>
            <span className="rmn-spay-box">
              <Field i={5} ph="1234 1234 1234 1234" value={PAY.card} extra={
                <span className="rmn-spay-brands">
                  <em className="m-visa">VISA</em><em className="m-mc">{MastercardMark}</em><em className="m-amex">AMEX</em>
                </span>
              } />
              <span className="rmn-spay-split">
                <Field i={6} ph="MM / YY" value={PAY.expiry} />
                <Field i={7} ph="CVC" value={PAY.cvc} />
              </span>
            </span>
          </div>
          <span className="rmn-spay-btn">{LockGlyph}Pay {PAY.amount}</span>
          <span className="rmn-spay-powered">
            {/* The official badge, unmodified (Stripe brand assets). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/powered-by-stripe-blurple.svg" alt="" width={150} height={34} loading="lazy" decoding="async" />
          </span>
        </div>

        <div className="rmn-spay-done">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/Rummanh_logo.png" alt="" width={84} height={84} loading="lazy" decoding="async" />
          <span className="badge">{CheckGlyph}</span>
          <b>Payment successful</b>
          <span className="sub">A receipt is on its way to {PAY.email}.</span>
          <span className="receipt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/product-thumb.webp" alt="" width={520} height={390} loading="lazy" decoding="async" />
            <span><b>{PAY.product}</b><i>{PAY.merchant} · paid</i></span>
            <em>{PAY.amount}</em>
          </span>
          <span className="secured">{LockGlyph}Secured by Rummanah</span>
        </div>
      </div>
    </div>
  )
}
