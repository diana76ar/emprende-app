import mercadopago from 'mercadopago'
import { prisma } from '../prisma.js'

const mercadopagoClient = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
})

export async function createCheckout(req, res) {
  try {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (!user.email) {
      return res.status(400).json({ error: 'El usuario no tiene email registrado' })
    }

    const preferencePayload = {
      items: [
        {
          id: 'pro_subscription',
          title: 'Plan PRO - Emprende App',
          description: 'Acceso ilimitado a productos y ventas',
          quantity: 1,
          currency_id: 'ARS', // Cambiar según tu país: ARS, BRL, MXN, etc.
          unit_price: 2999, // Precio en la moneda (2999 = $29.99 ARS)
        }
      ],
      payer: {
        email: user.email
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/success`,
        failure: `${process.env.FRONTEND_URL}/cancel`,
        pending: `${process.env.FRONTEND_URL}/cancel`
      },
      auto_return: 'approved',
      external_reference: userId, // Para identificar al usuario en el webhook
      notification_url: `${process.env.BACKEND_URL}/payment/webhook`
    }

    const preference = new mercadopago.Preference(mercadopagoClient)
    const result = await preference.create({ body: preferencePayload })
    const responseBody = result?.body ?? result?.response?.body
    const checkoutUrl = responseBody?.init_point || responseBody?.sandbox_init_point

    if (!checkoutUrl) {
      console.error('Mercado Pago preference response missing checkout URL:', result)
      return res.status(500).json({ error: 'No se pudo obtener la URL de checkout de Mercado Pago' })
    }

    res.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error)
    const message = error?.message || 'Error creando preferencia de pago'
    res.status(500).json({ error: message })
  }
}

export async function handleWebhook(req, res) {
  try {
    const { type, data } = req.body

    if (type === 'payment') {
      const paymentId = data.id

      const paymentService = new mercadopago.Payment(mercadopagoClient)
      const payment = await paymentService.get({ id: paymentId })

      if (payment.body.status === 'approved') {
        const userId = payment.body.external_reference

        await prisma.user.update({
          where: { id: userId },
          data: { plan: 'pro' }
        })

        console.log(`User ${userId} upgraded to PRO via Mercado Pago`)
      }
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error)
    res.status(500).json({ error: 'Error procesando webhook' })
  }
}