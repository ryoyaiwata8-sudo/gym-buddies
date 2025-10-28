// Unit conversion utilities

const KG_TO_LBS = 2.20462262

/**
 * Convert kg to lbs
 * @param kg Weight in kilograms
 * @returns Weight in pounds, rounded to 2 decimal places
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 100) / 100
}

/**
 * Convert lbs to kg
 * @param lbs Weight in pounds
 * @returns Weight in kilograms, rounded to 3 decimal places (internal precision)
 */
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 1000) / 1000
}

/**
 * Format weight for display based on unit preference
 * @param weightKg Weight in kilograms (always stored in kg)
 * @param unit User's preferred unit
 * @returns Formatted string with unit
 */
export function formatWeight(weightKg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    return `${kgToLbs(weightKg)} lbs`
  }
  return `${weightKg} kg`
}

/**
 * Convert weight for display based on unit preference
 * @param weightKg Weight in kilograms (always stored in kg)
 * @param unit User's preferred unit
 * @returns Weight in the preferred unit
 */
export function convertWeight(weightKg: number, unit: 'kg' | 'lbs' = 'kg'): number {
  if (unit === 'lbs') {
    return kgToLbs(weightKg)
  }
  return weightKg
}

/**
 * Calculate total load (volume) for a set
 * @param weightKg Weight in kilograms
 * @param reps Number of repetitions
 * @returns Total load (kg-reps)
 */
export function calculateLoad(weightKg: number, reps: number): number {
  return weightKg * reps
}

/**
 * Format load for display
 * @param load Load in kg-reps
 * @param showTons Whether to show tons as secondary value
 * @returns Formatted string
 */
export function formatLoad(load: number, showTons: boolean = false): string {
  if (showTons && load >= 1000) {
    const tons = (load / 1000).toFixed(2)
    return `${load.toFixed(0)} kg-reps (${tons}t)`
  }
  return `${load.toFixed(0)} kg-reps`
}
