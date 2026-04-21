import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PRICES = {
  couple:  process.env.STRIPE_PRICE_COUPLE!,
  premium: process.env.STRIPE_PRICE_PREMIUM!,
  planner: process.env.STRIPE_PRICE_PLANNER!,
} as const

export type PriceKey = keyof typeof PRICES
