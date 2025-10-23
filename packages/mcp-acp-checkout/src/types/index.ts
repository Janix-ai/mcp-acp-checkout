/**
 * Type definitions for mcp-acp-checkout SDK
 * 
 * This file contains all the TypeScript interfaces and types used throughout the SDK.
 * Think of these as "contracts" that define the shape of our data.
 */

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Currency codes (ISO 4217)
 * Currently supporting major currencies, can be expanded
 */
export type Currency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud'

/**
 * Product type - digital products don't need shipping
 */
export type ProductType = 'digital' | 'physical'

/**
 * Product definition
 * This is what a product looks like in your catalog
 */
export interface Product {
  /** Unique identifier for the product */
  id: string
  
  /** Product name (shown to customers) */
  name: string
  
  /** Detailed description */
  description: string
  
  /** Price in cents (e.g., 2999 = $29.99) */
  price: number
  
  /** Currency code */
  currency: Currency
  
  /** Product type */
  type: ProductType
  
  /** Optional: Main product image URL */
  image?: string
  
  /** Optional: Additional images */
  images?: string[]
  
  /** Optional: Product category */
  category?: string
  
  /** Optional: Search tags */
  tags?: string[]
  
  /** Optional: Any custom data you want to attach */
  metadata?: Record<string, any>
}

// =============================================================================
// CHECKOUT SESSION TYPES
// =============================================================================

/**
 * Checkout session status
 * Tracks the lifecycle of a checkout
 */
export type SessionStatus = 
  | 'pending'      // Just created, items may still be added
  | 'ready'        // Has items, ready for payment
  | 'processing'   // Payment in progress
  | 'completed'    // Payment successful
  | 'failed'       // Payment failed
  | 'expired'      // Session expired (typically 1 hour)
  | 'cancelled'    // Manually cancelled

/**
 * An item in the shopping cart
 */
export interface CartItem {
  /** Product ID */
  productId: string
  
  /** Quantity to purchase */
  quantity: number
  
  /** Price at time of adding (cents) - locked in when added */
  price: number
  
  /** Currency */
  currency: Currency
  
  /** Product name (cached for convenience) */
  name: string
  
  /** Optional: Custom data for this cart item */
  metadata?: Record<string, any>
}

/**
 * Buyer information
 */
export interface BuyerInfo {
  /** Email address (required for digital delivery) */
  email: string
  
  /** Optional: Full name */
  name?: string
  
  /** Optional: Phone number */
  phone?: string
  
  /** Optional: Shipping address (required for physical products) */
  address?: Address
}

/**
 * Shipping/billing address
 */
export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

/**
 * Totals breakdown
 */
export interface Totals {
  /** Sum of all items (cents) */
  subtotal: number
  
  /** Tax amount (cents) */
  tax: number
  
  /** Shipping cost (cents) */
  shipping: number
  
  /** Discount amount (cents) */
  discount: number
  
  /** Final total (cents) */
  total: number
  
  /** Currency for all amounts */
  currency: Currency
}

/**
 * Payment information
 */
export interface PaymentInfo {
  /** Stripe PaymentIntent ID */
  stripePaymentIntentId?: string
  
  /** Payment status */
  status: 'pending' | 'succeeded' | 'failed'
  
  /** When payment completed */
  paidAt?: Date
}

/**
 * Complete checkout session
 */
export interface CheckoutSession {
  /** Unique session ID */
  id: string
  
  /** Current status */
  status: SessionStatus
  
  /** Items in the cart */
  items: CartItem[]
  
  /** Buyer information */
  buyer?: BuyerInfo
  
  /** Price breakdown */
  totals: Totals
  
  /** Payment details (after payment initiated) */
  payment?: PaymentInfo
  
  /** When session was created */
  createdAt: Date
  
  /** When session expires */
  expiresAt: Date
  
  /** Optional: Custom data */
  metadata?: Record<string, any>
}

// =============================================================================
// ORDER TYPES
// =============================================================================

/**
 * Order status (after payment completes)
 */
export type OrderStatus = 
  | 'pending'      // Payment complete, awaiting fulfillment
  | 'fulfilled'    // Fulfillment complete
  | 'refunded'     // Order refunded
  | 'cancelled'    // Order cancelled

/**
 * Completed order
 */
export interface Order {
  /** Unique order ID */
  id: string
  
  /** Original session ID */
  sessionId: string
  
  /** Items purchased */
  items: CartItem[]
  
  /** Buyer information */
  buyer: BuyerInfo
  
  /** Final totals */
  totals: Totals
  
  /** Payment details */
  payment: {
    stripePaymentIntentId: string
    status: 'succeeded'
    paidAt: Date
  }
  
  /** Order status */
  status: OrderStatus
  
  /** When order was created */
  createdAt: Date
  
  /** When order was fulfilled */
  fulfilledAt?: Date
  
  /** Optional: Custom data */
  metadata?: Record<string, any>
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Stripe configuration
 */
export interface StripeConfig {
  /** Stripe secret key (sk_test_... or sk_live_...) */
  secretKey: string
  
  /** Optional: Webhook secret for signature verification */
  webhookSecret?: string
  
  /** Optional: Stripe API version */
  apiVersion?: string
}

/**
 * Session storage configuration
 */
export interface SessionConfig {
  /** Storage type */
  storage?: 'memory' | 'redis'
  
  /** Redis connection (if using redis) */
  redis?: {
    url: string
    prefix?: string
  }
  
  /** Session TTL in seconds (default: 3600 = 1 hour) */
  ttl?: number
}

/**
 * Tax calculation hook
 */
export interface TaxConfig {
  /** Function to calculate tax based on address and subtotal */
  calculate: (address: Address, subtotal: number) => Promise<number> | number
}

/**
 * Shipping calculation hook
 */
export interface ShippingConfig {
  /** Function to calculate shipping based on address and items */
  calculate: (address: Address, items: CartItem[]) => Promise<number> | number
}

/**
 * Main SDK configuration
 */
export interface CommerceConfig {
  /** Product catalog */
  products: Product[]
  
  /** Stripe configuration */
  stripe: StripeConfig
  
  /** Callback when purchase completes (for fulfillment) */
  onPurchase: (order: Order) => Promise<void> | void
  
  /** Optional: Session configuration */
  session?: SessionConfig
  
  /** Optional: Tax calculation */
  tax?: TaxConfig
  
  /** Optional: Shipping calculation */
  shipping?: ShippingConfig
  
  /** Optional: ChatGPT UI enhancements (future) */
  ui?: {
    enabled: boolean
    widgetDomain?: string
    theme?: {
      primaryColor?: string
      accentColor?: string
    }
  }
}

// =============================================================================
// MCP TYPES
// =============================================================================

/**
 * MCP Tool definition
 * This is what gets exposed to AI assistants (Claude, ChatGPT, etc.)
 */
export interface MCPTool {
  /** Tool name (machine-readable, e.g., "search_products") */
  name: string
  
  /** Human-friendly title */
  title?: string
  
  /** What the tool does */
  description: string
  
  /** Input parameters schema (JSON Schema) */
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  
  /** Optional: OpenAI-specific metadata */
  _meta?: Record<string, any>
  
  /** The function that executes when tool is called */
  execute: (args: any) => Promise<MCPToolResponse>
}

/**
 * MCP Tool Response
 * What the tool returns when called
 */
export interface MCPToolResponse {
  /** Standard MCP content (text, images, etc.) */
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }>
  
  /** Optional: Structured data for ChatGPT UI */
  structuredContent?: Record<string, any>
  
  /** Optional: Metadata not visible to the model */
  _meta?: Record<string, any>
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make all properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Async or sync function
 */
export type MaybePromise<T> = T | Promise<T>

