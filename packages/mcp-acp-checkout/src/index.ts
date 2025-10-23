/**
 * mcp-acp-checkout - Add ACP-compliant checkout to any MCP server
 * 
 * Enable AI agents (Claude, Cursor, ChatGPT) to purchase from your MCP server.
 * Works with Stripe and the Agentic Commerce Protocol (ACP).
 * 
 * @example
 * ```typescript
 * import { CommerceTools } from 'mcp-acp-checkout'
 * 
 * const commerce = new CommerceTools({
 *   products: [
 *     {
 *       id: 'ebook-1',
 *       name: 'My Ebook',
 *       description: 'Learn how to build MCP servers',
 *       price: 2999, // $29.99 in cents
 *       currency: 'usd',
 *       type: 'digital'
 *     }
 *   ],
 *   stripe: {
 *     secretKey: process.env.STRIPE_SECRET_KEY
 *   },
 *   onPurchase: async (order) => {
 *     console.log('New purchase!', order.id)
 *     // Send download link, fulfill order, etc.
 *   }
 * })
 * 
 * // Add tools to your MCP server
 * const tools = commerce.getMCPTools()
 * ```
 */

// Main SDK class
export { CommerceTools } from './commerce.js'

// Managers (for advanced usage)
export { SessionManager } from './managers/session.js'
export { PaymentManager } from './managers/payment.js'

// All types
export type {
  // Configuration
  CommerceConfig,
  StripeConfig,
  SessionConfig,
  TaxConfig,
  ShippingConfig,
  
  // Products
  Product,
  ProductType,
  Currency,
  
  // Checkout
  CheckoutSession,
  SessionStatus,
  CartItem,
  BuyerInfo,
  Address,
  Totals,
  PaymentInfo,
  
  // Orders
  Order,
  OrderStatus,
  
  // MCP
  MCPTool,
  MCPToolResponse,
  
  // Utilities
  MaybePromise,
  PartialBy
} from './types/index.js'

// Utilities (for advanced usage)
export {
  generateId,
  validateEmail,
  validateProduct,
  validateConfig,
  formatCurrency,
  calculateSubtotal,
  deepClone,
  sleep,
  isEmpty
} from './utils/index.js'

// Version
export const VERSION = '0.1.0'

