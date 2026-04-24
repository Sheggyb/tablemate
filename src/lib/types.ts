// Shared TypeScript types matching the Supabase schema

export type Plan = 'free' | 'couple' | 'premium' | 'planner'
export type Rsvp = 'pending' | 'confirmed' | 'declined'
export type Meal = 'standard' | 'vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'kosher' | 'children'
export type TableType = 'round' | 'rectangle' | 'oval'
export type RuleType = 'must_sit_with' | 'must_not_sit_with'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  plan: Plan
  stripe_customer_id: string | null
  created_at: string
}

export interface Wedding {
  id: string
  user_id: string
  name: string
  date: string | null
  couple_names: string | null
  share_code: string | null
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  wedding_id: string
  name: string
  background_image: string | null
  bg_opacity: number
  sort_order: number
}

export interface Table {
  id: string
  wedding_id?: string
  venue_id: string
  name: string
  shape: TableType
  capacity: number
  x: number
  y: number
  rotation?: number
}

export interface Group {
  id: string
  wedding_id: string
  name: string
  color: string
  invite_code: string | null
}

export interface Guest {
  id: string
  wedding_id: string
  table_id?: string | null
  group_id?: string | null
  seat_index?: number | null
  first_name: string
  last_name?: string | null
  email?: string | null
  phone?: string | null
  rsvp?: Rsvp
  meal?: Meal
  allergies?: string | null
  notes?: string | null
  rsvp_token?: string
  rsvp_responded_at?: string | null
  created_at?: string
}

export interface Wish {
  id: string
  wedding_id: string
  name: string
  message: string
  created_at: string
}

export interface Rule {
  id: string
  wedding_id: string
  guest1_id: string
  guest2_id: string
  type: RuleType
}

// Plan limits
export const PLAN_LIMITS: Record<Plan, { maxGuests: number; maxWeddings: number; features: string[] }> = {
  free:    { maxGuests: 50,        maxWeddings: 1,   features: ['basic-chart', 'csv-import'] },
  couple:  { maxGuests: 999999,   maxWeddings: 1,   features: ['basic-chart', 'csv-import', 'cloud-save', 'rsvp-portal', 'pdf-export', 'share-link'] },
  premium: { maxGuests: 999999,   maxWeddings: 1,   features: ['basic-chart', 'csv-import', 'cloud-save', 'rsvp-portal', 'pdf-export', 'share-link', 'ai-seating', 'collaboration', 'floor-plans'] },
  planner: { maxGuests: 999999,   maxWeddings: 999, features: ['basic-chart', 'csv-import', 'cloud-save', 'rsvp-portal', 'pdf-export', 'share-link', 'ai-seating', 'collaboration', 'floor-plans', 'multi-wedding', 'client-portals', 'white-label'] },
}
