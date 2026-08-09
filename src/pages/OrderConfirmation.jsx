import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { SparkleRow } from '../components/RetroAccents'
import { useCart } from '../context/CartContext.jsx'
import { trackCheckoutReturned } from '../lib/analytics'

export default function OrderConfirmation() {
  const { clearCart } = useCart()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Square only appends this ?order= token when it redirects here after a real
    // checkout attempt. Without it, someone just navigated here directly (bookmark,
    // back button, refresh, shared link) and we should NOT wipe their cart.
    //
    // IMPORTANT: Presence of ?order= is NOT verified payment success. Do not fire
    // purchase_completed here — that event is emitted only from the Square webhook
    // after payment.status === COMPLETED (see api/square-webhook.js).
    const orderToken = searchParams.get('order')
    const hasOrderToken = Boolean(orderToken)
    trackCheckoutReturned({ hasOrderToken })
    if (hasOrderToken) {
      clearCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageMeta
        title="Order Confirmed | RetroCharm Co"
        description="Thank you for your RetroCharm Co order. We are preparing your custom bracelet."
        path="/order-confirmation"
        noindex
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-jscolors-cream via-[#ddd0b8] to-jscolors-cream text-jscolors-ink">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
          <SparkleRow className="mx-auto" />
          <h1 className="mt-8 font-display text-4xl font-bold text-jscolors-ink md:text-5xl">
            Your order is confirmed! 🎉
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-jscolors-ink/80">
            Thank you so much for supporting RetroCharm Co. We are now preparing your bracelet and will follow up with your
            order details shortly.
          </p>
          <Link
            to="/"
            className="mt-10 inline-block rounded-full bg-jscolors-blue px-8 py-3 text-sm font-semibold text-jscolors-cream shadow-lg shadow-jscolors-blue/20 transition hover:bg-jscolors-blue-hover"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </>
  )
}
