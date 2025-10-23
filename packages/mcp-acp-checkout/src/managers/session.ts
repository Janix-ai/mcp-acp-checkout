/**
 * Session Manager
 * 
 * Handles checkout session storage and lifecycle.
 * For MVP, we use in-memory storage. Later can add Redis support.
 */

import type { 
  CheckoutSession, 
  SessionStatus, 
  CartItem, 
  BuyerInfo, 
  Product 
} from '../types/index.js'
import { generateId, calculateSubtotal } from '../utils/index.js'

/**
 * SessionManager class
 * 
 * WHAT THIS DOES:
 * - Creates new checkout sessions
 * - Stores sessions in memory (Map)
 * - Adds/removes items from cart
 * - Updates buyer info
 * - Calculates totals
 * - Handles session expiration
 */
export class SessionManager {
  /**
   * In-memory storage for sessions
   * Map<sessionId, CheckoutSession>
   * 
   * WHY A MAP?
   * - Fast lookups by ID: O(1)
   * - Built into JavaScript
   * - Easy to iterate over all sessions
   */
  private sessions: Map<string, CheckoutSession> = new Map()
  
  /**
   * Product catalog (passed from config)
   * Used to look up product details when adding to cart
   */
  private products: Map<string, Product> = new Map()
  
  /**
   * Session TTL (time to live) in milliseconds
   * Default: 1 hour
   */
  private sessionTTL: number
  
  /**
   * Constructor
   * 
   * @param products - Product catalog
   * @param ttl - Session TTL in seconds (default: 3600 = 1 hour)
   */
  constructor(products: Product[], ttl: number = 3600) {
    // Convert products array to Map for fast lookups
    products.forEach(product => {
      this.products.set(product.id, product)
    })
    
    // Convert TTL from seconds to milliseconds
    this.sessionTTL = ttl * 1000
    
    // Start cleanup interval (every 5 minutes)
    this.startCleanupInterval()
  }
  
  /**
   * Create a new checkout session
   * 
   * @returns New checkout session with empty cart
   */
  create(): CheckoutSession {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.sessionTTL)
    
    const session: CheckoutSession = {
      id: generateId('cs_'), // cs_ prefix for "checkout session"
      status: 'pending',
      items: [],
      totals: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        currency: 'usd' // Will be set when first item added
      },
      createdAt: now,
      expiresAt: expiresAt
    }
    
    // Store in memory
    this.sessions.set(session.id, session)
    
    return session
  }
  
  /**
   * Get a session by ID
   * 
   * @param sessionId - Session ID
   * @returns Session or null if not found/expired
   */
  get(sessionId: string): CheckoutSession | null {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return null
    }
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }
    
    return session
  }
  
  /**
   * Add item to cart
   * 
   * @param sessionId - Session ID
   * @param productId - Product ID to add
   * @param quantity - Quantity (default: 1)
   * @throws Error if session not found or product doesn't exist
   */
  addItem(sessionId: string, productId: string, quantity: number = 1): CheckoutSession {
    const session = this.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    const product = this.products.get(productId)
    if (!product) {
      throw new Error(`Product not found: ${productId}`)
    }
    
    if (quantity <= 0) {
      throw new Error('Quantity must be positive')
    }
    
    // Check if item already in cart
    const existingItem = session.items.find(item => item.productId === productId)
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity
    } else {
      // Add new item
      const cartItem: CartItem = {
        productId: product.id,
        quantity: quantity,
        price: product.price,
        currency: product.currency,
        name: product.name
      }
      session.items.push(cartItem)
    }
    
    // Recalculate totals
    this.recalculateTotals(session)
    
    // Update status to 'ready' if this is first item
    if (session.status === 'pending' && session.items.length > 0) {
      session.status = 'ready'
    }
    
    return session
  }
  
  /**
   * Remove item from cart
   * 
   * @param sessionId - Session ID
   * @param productId - Product ID to remove
   */
  removeItem(sessionId: string, productId: string): CheckoutSession {
    const session = this.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    // Filter out the item
    session.items = session.items.filter(item => item.productId !== productId)
    
    // Recalculate totals
    this.recalculateTotals(session)
    
    // Update status to 'pending' if cart is now empty
    if (session.items.length === 0) {
      session.status = 'pending'
    }
    
    return session
  }
  
  /**
   * Update item quantity
   * 
   * @param sessionId - Session ID
   * @param productId - Product ID
   * @param quantity - New quantity (0 removes item)
   */
  updateQuantity(sessionId: string, productId: string, quantity: number): CheckoutSession {
    if (quantity === 0) {
      return this.removeItem(sessionId, productId)
    }
    
    const session = this.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    const item = session.items.find(item => item.productId === productId)
    if (!item) {
      throw new Error('Item not in cart')
    }
    
    item.quantity = quantity
    this.recalculateTotals(session)
    
    return session
  }
  
  /**
   * Set buyer information
   * 
   * @param sessionId - Session ID
   * @param buyer - Buyer information
   */
  setBuyer(sessionId: string, buyer: BuyerInfo): CheckoutSession {
    const session = this.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    session.buyer = buyer
    
    // Recalculate totals (tax/shipping may depend on address)
    this.recalculateTotals(session)
    
    return session
  }
  
  /**
   * Update session status
   * 
   * @param sessionId - Session ID
   * @param status - New status
   */
  updateStatus(sessionId: string, status: SessionStatus): CheckoutSession {
    const session = this.get(sessionId)
    if (!session) {
      throw new Error('Session not found or expired')
    }
    
    session.status = status
    return session
  }
  
  /**
   * Delete a session
   * 
   * @param sessionId - Session ID
   */
  delete(sessionId: string): void {
    this.sessions.delete(sessionId)
  }
  
  /**
   * Recalculate session totals
   * This is called whenever cart changes
   * 
   * @param session - Session to update
   */
  private recalculateTotals(session: CheckoutSession): void {
    // Calculate subtotal
    const subtotal = calculateSubtotal(session.items)
    
    // For MVP, tax and shipping are 0
    // These will be calculated by tax/shipping hooks in the main SDK
    const tax = 0
    const shipping = 0
    const discount = 0
    
    const total = subtotal + tax + shipping - discount
    
    // Set currency from first item (all items must have same currency)
    const currency = session.items.length > 0 
      ? session.items[0].currency 
      : 'usd'
    
    session.totals = {
      subtotal,
      tax,
      shipping,
      discount,
      total,
      currency
    }
  }
  
  /**
   * Clean up expired sessions
   * Runs periodically to free memory
   */
  private cleanup(): void {
    const now = new Date()
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId)
      }
    }
  }
  
  /**
   * Start cleanup interval
   * Runs cleanup every 5 minutes
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // 5 minutes
  }
  
  /**
   * Get all active sessions (for debugging)
   * 
   * @returns Array of all sessions
   */
  getAllSessions(): CheckoutSession[] {
    return Array.from(this.sessions.values())
  }
  
  /**
   * Get session count (for monitoring)
   * 
   * @returns Number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size
  }
}

