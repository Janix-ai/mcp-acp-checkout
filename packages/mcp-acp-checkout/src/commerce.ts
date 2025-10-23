/**
 * CommerceTools - Main SDK Class
 * 
 * This is the primary class that developers import and use.
 * It orchestrates SessionManager, PaymentManager, and exposes MCP tools.
 */

import type { 
  CommerceConfig,
  CheckoutSession,
  Order,
  Product,
  BuyerInfo,
  MCPTool
} from './types/index.js'
import { SessionManager } from './managers/session.js'
import { PaymentManager } from './managers/payment.js'
import { validateConfig } from './utils/index.js'

/**
 * CommerceTools class
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const commerce = new CommerceTools({
 *   products: [...],
 *   stripe: { secretKey: 'sk_test_...' },
 *   onPurchase: async (order) => {
 *     console.log('New order:', order.id)
 *     // Handle fulfillment
 *   }
 * })
 * 
 * // Get MCP tools to add to your server
 * const tools = commerce.getMCPTools()
 * ```
 */
export class CommerceTools {
  private config: CommerceConfig
  private sessionManager: SessionManager
  private paymentManager: PaymentManager
  
  /**
   * Store completed orders in memory
   * In production, you'd persist these to a database
   */
  private orders: Map<string, Order> = new Map()
  
  /**
   * Constructor
   * 
   * @param config - SDK configuration
   * @throws Error if configuration is invalid
   */
  constructor(config: CommerceConfig) {
    // Validate configuration
    validateConfig(config)
    
    this.config = config
    
    // Initialize managers
    this.sessionManager = new SessionManager(
      config.products,
      config.session?.ttl
    )
    
    this.paymentManager = new PaymentManager(config.stripe)
  }
  
  // ===========================================================================
  // PUBLIC API - For use in your application code
  // ===========================================================================
  
  /**
   * Create a new checkout session
   * 
   * @returns New checkout session
   */
  createSession(): CheckoutSession {
    return this.sessionManager.create()
  }
  
  /**
   * Get a checkout session by ID
   * 
   * @param sessionId - Session ID
   * @returns Session or null if not found
   */
  getSession(sessionId: string): CheckoutSession | null {
    return this.sessionManager.get(sessionId)
  }
  
  /**
   * Add item to cart
   * 
   * @param sessionId - Session ID (optional - will create new session if not provided)
   * @param productId - Product ID
   * @param quantity - Quantity to add
   * @returns Updated session
   */
  addToCart(sessionId: string | undefined, productId: string, quantity: number = 1): CheckoutSession {
    // Auto-create session if not provided
    if (!sessionId) {
      const newSession = this.sessionManager.create()
      sessionId = newSession.id
    }
    return this.sessionManager.addItem(sessionId, productId, quantity)
  }
  
  /**
   * Remove item from cart
   * 
   * @param sessionId - Session ID
   * @param productId - Product ID to remove
   * @returns Updated session
   */
  removeFromCart(sessionId: string, productId: string): CheckoutSession {
    return this.sessionManager.removeItem(sessionId, productId)
  }
  
  /**
   * Update item quantity
   * 
   * @param sessionId - Session ID
   * @param productId - Product ID
   * @param quantity - New quantity
   * @returns Updated session
   */
  updateQuantity(sessionId: string, productId: string, quantity: number): CheckoutSession {
    return this.sessionManager.updateQuantity(sessionId, productId, quantity)
  }
  
  /**
   * Set buyer information
   * 
   * @param sessionId - Session ID (optional - will create new session if not provided)
   * @param buyer - Buyer information
   * @returns Updated session
   */
  setBuyer(sessionId: string | undefined, buyer: BuyerInfo): CheckoutSession {
    // Auto-create session if not provided
    if (!sessionId) {
      const newSession = this.sessionManager.create()
      sessionId = newSession.id
    }
    return this.sessionManager.setBuyer(sessionId, buyer)
  }
  
  /**
   * Create SharedPaymentToken from payment method
   * 
   * THIS ENABLES TESTING IN CLAUDE/CURSOR:
   * - Simulates what ChatGPT does (collect card, create SPT)
   * - Returns SPT that can be used with completeCheckout
   * - Makes ACP flow testable in any MCP client
   * 
   * ⚠️ SECURITY WARNING - TEST MODE ONLY:
   * - Using raw card numbers requires PCI compliance in production
   * - In production, ChatGPT collects cards securely (never touches your server)
   * - For testing, prefer Stripe test tokens: pm_card_visa, pm_card_mastercard, etc.
   * 
   * @param sessionId - Session ID
   * @param paymentMethodId - Stripe PaymentMethod ID (e.g., pm_card_visa) OR
   * @param cardNumber - Card number (requires Stripe test setting enabled)
   * @param expMonth - Expiry month (1-12)
   * @param expYear - Expiry year (4 digits)
   * @param cvc - Card CVC
   * @returns SharedPaymentToken
   */
  async createPaymentToken(
    sessionId: string,
    paymentMethodId?: string,
    cardNumber?: string,
    expMonth?: number,
    expYear?: number,
    cvc?: string
  ): Promise<string> {
    const session = this.sessionManager.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    if (session.items.length === 0) {
      throw new Error('Cannot create payment token for empty cart')
    }
    
    if (session.totals.total <= 0) {
      throw new Error('Total must be greater than 0')
    }
    
    // Create SPT using PaymentManager
    const spt = await this.paymentManager.createSharedPaymentToken(session, {
      paymentMethodId,
      cardDetails: (cardNumber && expMonth && expYear && cvc) ? {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc
      } : undefined
    })
    
    return spt
  }
  
  /**
   * Create payment link for browser-based checkout
   * 
   * THIS IS FOR NON-CHATGPT CLIENTS (Claude, Cursor, etc.):
   * - Generates Stripe Checkout URL
   * - User completes payment in browser (cards, Apple Pay, Google Pay, Link)
   * - Webhook confirms payment and triggers fulfillment
   * - Use this when AI client doesn't have payment UI
   * 
   * @param sessionId - Session ID
   * @param successUrl - Optional URL to redirect after payment
   * @param cancelUrl - Optional URL to redirect if cancelled
   * @returns Object with payment URL and session info
   */
  async createPaymentLink(
    sessionId: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{
    url: string
    expiresAt: string
    stripeSessionId: string
  }> {
    const session = this.sessionManager.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    if (session.items.length === 0) {
      throw new Error('Cannot create payment link for empty cart')
    }
    
    if (!session.buyer || !session.buyer.email) {
      throw new Error('Buyer email is required')
    }
    
    // Create Stripe Checkout Session
    const stripeSession = await this.paymentManager.createCheckoutSession(
      session,
      successUrl,
      cancelUrl
    )
    
    return {
      url: stripeSession.url!,
      expiresAt: new Date(stripeSession.expires_at! * 1000).toISOString(),
      stripeSessionId: stripeSession.id
    }
  }
  
  /**
   * Complete a checkout with SharedPaymentToken
   * 
   * THIS IS THE ACP MAGIC (CHATGPT):
   * - AI agent calls this with SPT from user
   * - We process payment via Stripe
   * - Create order and trigger fulfillment
   * 
   * @param sessionId - Session ID
   * @param sharedPaymentToken - Stripe SharedPaymentToken from AI agent
   * @returns Completed order
   */
  async completeCheckout(sessionId: string, sharedPaymentToken: string): Promise<Order> {
    const session = this.sessionManager.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    if (session.items.length === 0) {
      throw new Error('Cannot checkout with empty cart')
    }
    
    if (!session.buyer || !session.buyer.email) {
      throw new Error('Buyer email is required')
    }
    
    // Update session status
    this.sessionManager.updateStatus(sessionId, 'processing')
    
    try {
      // Process payment with SPT
      const paymentIntent = await this.paymentManager.processSharedPaymentToken(
        session,
        sharedPaymentToken
      )
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed: ${paymentIntent.status}`)
      }
      
      // Create order
      const order = this.paymentManager.createOrderFromSession(session, paymentIntent)
      
      // Store order
      this.orders.set(order.id, order)
      
      // Update session
      this.sessionManager.updateStatus(sessionId, 'completed')
      
      // Trigger fulfillment callback
      await this.config.onPurchase(order)
      
      // Clean up session (optional, let it expire naturally)
      // this.sessionManager.delete(sessionId)
      
      return order
    } catch (error) {
      // Update session status to failed
      this.sessionManager.updateStatus(sessionId, 'failed')
      throw error
    }
  }
  
  /**
   * Cancel a checkout session
   * 
   * @param sessionId - Session ID
   */
  async cancelCheckout(sessionId: string): Promise<void> {
    const session = this.sessionManager.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    // If payment was initiated, cancel it
    if (session.payment?.stripePaymentIntentId) {
      await this.paymentManager.cancelPaymentIntent(session.payment.stripePaymentIntentId)
    }
    
    // Update session status
    this.sessionManager.updateStatus(sessionId, 'cancelled')
  }
  
  /**
   * Get an order by ID
   * 
   * @param orderId - Order ID
   * @returns Order or null if not found
   */
  getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null
  }
  
  /**
   * Get all orders (for admin/debugging)
   * 
   * @returns Array of all orders
   */
  getAllOrders(): Order[] {
    return Array.from(this.orders.values())
  }
  
  /**
   * Search products
   * 
   * @param query - Search query
   * @returns Matching products
   */
  searchProducts(query?: string): Product[] {
    if (!query) {
      return this.config.products
    }
    
    const lowerQuery = query.toLowerCase()
    
    return this.config.products.filter(product => {
      return (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    })
  }
  
  /**
   * Get product by ID
   * 
   * @param productId - Product ID
   * @returns Product or null if not found
   */
  getProduct(productId: string): Product | null {
    return this.config.products.find(p => p.id === productId) || null
  }
  
  // ===========================================================================
  // MCP TOOLS - These are exposed to AI assistants
  // ===========================================================================
  
  /**
   * Get MCP tools for your MCP server
   * 
   * WHAT THIS RETURNS:
   * - Array of 10 tool definitions (complete cart management!)
   * - Each tool has: name, description, input schema, execute function
   * - You add these to your MCP server's tool list
   * 
   * TOOLS PROVIDED:
   * 1. search_products - Browse/search catalog
   * 2. create_checkout - Start session (optional, auto-created)
   * 3. add_to_cart - Add items (auto-creates session)
   * 4. set_buyer_info - Set email/name (auto-creates session)
   * 5. create_payment_link - Generate Stripe Checkout URL (RECOMMENDED for Claude/Cursor)
   * 6. collect_payment_info - Create SPT from test tokens (TEST ONLY)
   * 7. complete_checkout - Process SPT payment (ChatGPT production)
   * 8. remove_from_cart - Remove items from cart
   * 9. update_cart_quantity - Change item quantities
   * 10. get_checkout_status - View cart details
   * 
   * EXAMPLE:
   * ```typescript
   * const tools = commerce.getMCPTools()
   * 
   * // In your MCP server:
   * server.setRequestHandler(ListToolsRequestSchema, async () => ({
   *   tools: tools.map(t => ({
   *     name: t.name,
   *     description: t.description,
   *     inputSchema: t.inputSchema
   *   }))
   * }))
   * 
   * server.setRequestHandler(CallToolRequestSchema, async (request) => {
   *   const tool = tools.find(t => t.name === request.params.name)
   *   return await tool.execute(request.params.arguments)
   * })
   * ```
   * 
   * @returns Array of MCP tools
   */
  getMCPTools(): MCPTool[] {
    return [
      // Search products
      {
        name: 'search_products',
        title: 'Search Products',
        description: 'Search for available products. Returns product details including name, description, price, and ID.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (optional, omit to return all products)'
            }
          }
        },
        execute: async (args: any) => {
          const products = this.searchProducts(args.query)
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(products, null, 2)
            }]
          }
        }
      },
      
      // Create checkout session
      {
        name: 'create_checkout',
        title: 'Create Checkout Session',
        description: 'Create a new checkout session. Returns a session ID that can be used to add items and complete purchase.',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        execute: async () => {
          const session = this.createSession()
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                sessionId: session.id,
                status: session.status,
                expiresAt: session.expiresAt
              }, null, 2)
            }]
          }
        }
      },
      
      // Add to cart
      {
        name: 'add_to_cart',
        title: 'Add Item to Cart',
        description: 'Add a product to the checkout session cart. Creates a new session automatically if sessionId is not provided.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID (optional - will create new session if omitted)'
            },
            productId: {
              type: 'string',
              description: 'Product ID to add'
            },
            quantity: {
              type: 'number',
              description: 'Quantity to add (default: 1)'
            }
          },
          required: ['productId']
        },
        execute: async (args: any) => {
          const session = this.addToCart(
            args.sessionId, 
            args.productId, 
            args.quantity || 1
          )
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                sessionId: session.id,
                items: session.items,
                totals: session.totals
              }, null, 2)
            }]
          }
        }
      },
      
      // Set buyer info
      {
        name: 'set_buyer_info',
        title: 'Set Buyer Information',
        description: 'Set buyer information (email, name, address) for the checkout session. Creates a new session automatically if sessionId is not provided.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID (optional - will create new session if omitted)'
            },
            email: {
              type: 'string',
              description: 'Buyer email address'
            },
            name: {
              type: 'string',
              description: 'Buyer full name (optional)'
            }
          },
          required: ['email']
        },
        execute: async (args: any) => {
          const session = this.setBuyer(args.sessionId, {
            email: args.email,
            name: args.name
          })
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                sessionId: session.id,
                buyer: session.buyer,
                status: session.status
              }, null, 2)
            }]
          }
        }
      },
      
      // Create payment link (for Claude/Cursor - browser-based payment)
      {
        name: 'create_payment_link',
        title: 'Create Payment Link',
        description: 'Generate a secure Stripe Checkout link for browser payment. Supports cards, Apple Pay, Google Pay, and Link. Best for Claude/Cursor/non-ChatGPT clients. User completes payment in browser.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID'
            },
            successUrl: {
              type: 'string',
              description: 'Optional URL to redirect after successful payment (default: example success page)'
            },
            cancelUrl: {
              type: 'string',
              description: 'Optional URL to redirect if payment cancelled (default: example cancel page)'
            }
          },
          required: ['sessionId']
        },
        execute: async (args: any) => {
          const result = await this.createPaymentLink(
            args.sessionId,
            args.successUrl,
            args.cancelUrl
          )
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                paymentUrl: result.url,
                message: 'Payment link created! User should open this URL to complete payment.',
                expiresAt: result.expiresAt,
                stripeSessionId: result.stripeSessionId,
                paymentMethods: 'Supports: Cards, Apple Pay, Google Pay, Link by Stripe',
                note: 'This is the RECOMMENDED approach for Claude/Cursor. User completes payment securely in browser.'
              }, null, 2)
            }]
          }
        }
      },
      
      // Collect payment info (TEST ONLY - simulates ChatGPT's payment collection)
      {
        name: 'collect_payment_info',
        title: 'Collect Payment Info (TEST ONLY)',
        description: '⚠️ DEVELOPMENT ONLY - Simulates ChatGPT payment collection for testing. RECOMMENDED: Use create_payment_link instead for real payments. For testing: use paymentMethodId (pm_card_visa). In production with ChatGPT, ChatGPT handles this.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID'
            },
            paymentMethodId: {
              type: 'string',
              description: 'Stripe test PaymentMethod ID (RECOMMENDED: pm_card_visa, pm_card_mastercard, pm_card_amex)'
            },
            cardNumber: {
              type: 'string',
              description: '⚠️ AVOID: Card number (REQUIRES Stripe test setting: use 4242424242424242 for Visa)'
            },
            expMonth: {
              type: 'number',
              description: 'Expiry month (1-12, only if using cardNumber)'
            },
            expYear: {
              type: 'number',
              description: 'Expiry year (4 digits, only if using cardNumber)'
            },
            cvc: {
              type: 'string',
              description: 'Card CVC (only if using cardNumber)'
            }
          },
          required: ['sessionId']
        },
        execute: async (args: any) => {
          const spt = await this.createPaymentToken(
            args.sessionId,
            args.paymentMethodId,
            args.cardNumber,
            args.expMonth,
            args.expYear,
            args.cvc
          )
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                sharedPaymentToken: spt,
                message: 'Payment token created successfully. Use this token with complete_checkout to finalize the purchase.',
                note: 'TEST ONLY: In production, use create_payment_link for Claude/Cursor. ChatGPT handles payment collection automatically.'
              }, null, 2)
            }]
          }
        }
      },
      
      // Complete checkout
      {
        name: 'complete_checkout',
        title: 'Complete Checkout',
        description: 'Complete the checkout with payment. Requires a SharedPaymentToken from Stripe.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID'
            },
            sharedPaymentToken: {
              type: 'string',
              description: 'Stripe SharedPaymentToken (spt_...)'
            }
          },
          required: ['sessionId', 'sharedPaymentToken']
        },
        execute: async (args: any) => {
          const order = await this.completeCheckout(
            args.sessionId,
            args.sharedPaymentToken
          )
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                orderId: order.id,
                status: order.status,
                total: order.totals.total,
                currency: order.totals.currency
              }, null, 2)
            }]
          }
        }
      },
      
      // Remove from cart
      {
        name: 'remove_from_cart',
        title: 'Remove Item from Cart',
        description: 'Remove a product from the checkout session cart.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID'
            },
            productId: {
              type: 'string',
              description: 'Product ID to remove'
            }
          },
          required: ['sessionId', 'productId']
        },
        execute: async (args: any) => {
          const session = this.sessionManager.removeItem(args.sessionId, args.productId)
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                sessionId: session.id,
                items: session.items,
                totals: session.totals,
                message: `Removed product from cart. ${session.items.length} item(s) remaining.`
              }, null, 2)
            }]
          }
        }
      },
      
      // Update cart quantity
      {
        name: 'update_cart_quantity',
        title: 'Update Item Quantity',
        description: 'Update the quantity of a product in the cart.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID'
            },
            productId: {
              type: 'string',
              description: 'Product ID to update'
            },
            quantity: {
              type: 'number',
              description: 'New quantity (must be > 0)'
            }
          },
          required: ['sessionId', 'productId', 'quantity']
        },
        execute: async (args: any) => {
          const session = this.sessionManager.updateQuantity(
            args.sessionId,
            args.productId,
            args.quantity
          )
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                sessionId: session.id,
                items: session.items,
                totals: session.totals,
                message: `Updated quantity to ${args.quantity}.`
              }, null, 2)
            }]
          }
        }
      },
      
      // Get checkout status
      {
        name: 'get_checkout_status',
        title: 'Get Checkout Status',
        description: 'Get the current status and details of a checkout session. Shows all items in cart, buyer info, and total.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Checkout session ID'
            }
          },
          required: ['sessionId']
        },
        execute: async (args: any) => {
          const session = this.getSession(args.sessionId)
          if (!session) {
            throw new Error('Session not found or expired')
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(session, null, 2)
            }]
          }
        }
      }
    ]
  }
  
  /**
   * Get Stripe PaymentManager instance
   * For advanced usage and direct Stripe API access
   * 
   * @returns PaymentManager instance
   */
  getPaymentManager(): PaymentManager {
    return this.paymentManager
  }
  
  /**
   * Get SessionManager instance
   * For advanced session management
   * 
   * @returns SessionManager instance
   */
  getSessionManager(): SessionManager {
    return this.sessionManager
  }
}

