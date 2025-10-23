/**
 * Standardized color palette for all charts across the application
 *
 * Usage Guidelines:
 * - Brand (Anduin) data should always use BRAND_COLOR (first in palette)
 * - Multi-entity/cluster charts should use CHART_COLORS in order
 * - Use NEUTRAL_COLOR for "other" or background categories
 */

export const CHART_COLORS = [
  '#162950', // brand-navy (Anduin primary)
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
] as const

export const NEUTRAL_COLOR = '#94a3b8' // slate-400 - for "without" or "other" categories

export const BRAND_COLOR = CHART_COLORS[0] // #162950 - Anduin brand navy
