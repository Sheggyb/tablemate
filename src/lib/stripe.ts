import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const PRICES = {
  couple:  process.env.STRIPE_PRICE_COUPLE!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  planner: process.env.STRIPE_PRICE_PLANNER!,
} as const

export type PriceKey = keyof typeof PRICES
