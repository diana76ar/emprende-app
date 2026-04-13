import Stripe from 'stripe'
import { prisma } from '../prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET)

export async function createCheckout(req, res) {
  try {
    const userId = req.user.userId

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_ID, // price_xxx creado en Stripe
        quantity: 1
      }],
      metadata: {
        userId
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout:', error)
    res.status(500).json({ error: 'Error creando checkout' })
  }
}

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata.userId

    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'pro' }
    })

    console.log(`User ${userId} upgraded to PRO`)
  }

  res.json({ received: true })
}