/**
 * Utility functions for the commerce SDK
 */

import type { Product, CommerceConfig } from '../types/index.js'

/**
 * Generate a random ID
 * Used for session IDs, order IDs, etc.
 * 
 * @param prefix - Optional prefix (e.g., "cs_" for checkout session)
 * @param length - Length of random part (default: 16)
 * @returns Random ID string
 */
export function generateId(prefix: string = '', length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = prefix
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Validate email address
 * Simple regex-based validation
 * 
 * @param email - Email address to validate
 * @returns true if valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate product definition
 * Ensures product has all required fields
 * 
 * @param product - Product to validate
 * @throws Error if product is invalid
 */
export function validateProduct(product: Product): void {
  if (!product.id) {
    throw new Error('Product ID is required')
  }
  
  if (!product.name) {
    throw new Error('Product name is required')
  }
  
  if (!product.description) {
    throw new Error('Product description is required')
  }
  
  if (typeof product.price !== 'number' || product.price < 0) {
    throw new Error('Product price must be a non-negative number')
  }
  
  if (!['digital', 'physical'].includes(product.type)) {
    throw new Error('Product type must be "digital" or "physical"')
  }
  
  if (!product.currency) {
    throw new Error('Product currency is required')
  }
}

/**
 * Validate SDK configuration
 * Ensures config has all required fields
 * 
 * @param config - Configuration to validate
 * @throws Error if config is invalid
 */
export function validateConfig(config: CommerceConfig): void {
  // Check products
  if (!config.products || !Array.isArray(config.products)) {
    throw new Error('Configuration must include a products array')
  }
  
  if (config.products.length === 0) {
    throw new Error('At least one product is required')
  }
  
  // Validate each product
  config.products.forEach((product, index) => {
    try {
      validateProduct(product)
    } catch (error) {
      throw new Error(`Invalid product at index ${index}: ${(error as Error).message}`)
    }
  })
  
  // Check Stripe
  if (!config.stripe || !config.stripe.secretKey) {
    throw new Error('Stripe secret key is required')
  }
  
  if (!config.stripe.secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format (should start with sk_)')
  }
  
  // Check onPurchase callback
  if (!config.onPurchase || typeof config.onPurchase !== 'function') {
    throw new Error('onPurchase callback is required')
  }
}

/**
 * Format currency amount
 * Converts cents to dollar format
 * 
 * @param cents - Amount in cents
 * @param currency - Currency code
 * @returns Formatted string (e.g., "$29.99")
 */
export function formatCurrency(cents: number, currency: string = 'usd'): string {
  const dollars = cents / 100
  
  const symbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    cad: 'CA$',
    aud: 'A$'
  }
  
  const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase()
  
  return `${symbol}${dollars.toFixed(2)}`
}

/**
 * Calculate totals from cart items
 * Helper to sum up all items in cart
 * 
 * @param items - Cart items
 * @returns Subtotal in cents
 */
export function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

/**
 * Deep clone an object
 * Simple JSON-based cloning for our data types
 * 
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Wait for a specified time
 * Useful for testing and retry logic
 * 
 * @param ms - Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if object is empty
 * 
 * @param obj - Object to check
 * @returns true if object has no own properties
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0
}

