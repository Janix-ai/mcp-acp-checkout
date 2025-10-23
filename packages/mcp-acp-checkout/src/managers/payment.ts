/**
 * Payment Manager
 * 
 * Handles Stripe integration and payment processing.
 * This is where SharedPaymentToken (SPT) magic happens for ACP compliance.
 */

import Stripe from 'stripe'
import type { CheckoutSession, Order, StripeConfig } from '../types/index.js'
import { generateId } from '../utils/index.js'

/**
 * PaymentManager class
 * 
 * WHAT THIS DOES:
 * - Initializes Stripe client
 * - Creates PaymentIntents
 * - Processes SharedPaymentToken (SPT) for ACP
 * - Handles payment confirmations
 * - Creates orders after successful payment
 */
export class PaymentManager {
  /**
   * Stripe client instance
   * This is the official Stripe SDK
   */
  private stripe: Stripe
  
  /**
   * Stripe API key (for direct API calls)
   */
  private apiKey: string
  
  /**
   * Webhook secret for verifying webhook signatures
   */
  private webhookSecret?: string
  
  /**
   * Constructor
   * 
   * @param config - Stripe configuration
   */
  constructor(config: StripeConfig) {
    // Initialize Stripe client
    // The Stripe constructor requires API key and optional config
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-02-24.acacia', // Use latest ACP-compatible version
      typescript: true // Enable TypeScript types
    })
    
    this.apiKey = config.secretKey
    this.webhookSecret = config.webhookSecret
  }
  
  /**
   * Create a PaymentIntent for a checkout session
   * 
   * WHAT'S A PAYMENT INTENT?
   * - Stripe's representation of a payment
   * - Tracks the payment lifecycle
   * - Can be confirmed with payment method later
   * 
   * @param session - Checkout session
   * @returns Stripe PaymentIntent
   */
  async createPaymentIntent(session: CheckoutSession): Promise<Stripe.PaymentIntent> {
    // Validation
    if (session.items.length === 0) {
      throw new Error('Cannot create payment for empty cart')
    }
    
    if (session.totals.total <= 0) {
      throw new Error('Total must be greater than 0')
    }
    
    // Create PaymentIntent
    // This is a Stripe API call
    const paymentIntent = await this.stripe.paymentIntents.create({
      // Amount in cents
      amount: session.totals.total,
      
      // Currency
      currency: session.totals.currency,
      
      // Metadata for tracking
      metadata: {
        sessionId: session.id,
        buyerEmail: session.buyer?.email || '',
        itemCount: session.items.length.toString()
      },
      
      // Description for Stripe dashboard
      description: `Order from session ${session.id}`,
      
      // Optional: Buyer email for receipts
      receipt_email: session.buyer?.email,
      
      // Automatic payment methods (enables ACP)
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never' // Important for AI agents
      }
    })
    
    return paymentIntent
  }
  
  /**
   * Create SharedPaymentToken from payment method
   * 
   * THIS SIMULATES WHAT CHATGPT DOES:
   * - In production: ChatGPT collects card, creates SPT, sends to merchant
   * - For testing: We create SPT from PaymentMethod ID or raw card
   * - Result: Same ACP flow works in both ChatGPT and Claude/Cursor
   * 
   * ⚠️ SECURITY NOTE:
   * - Using raw card data is TEST-ONLY and requires PCI compliance in production
   * - Prefer using Stripe test tokens (pm_card_visa, pm_card_mastercard, etc.)
   * - In production, ChatGPT handles card collection securely
   * 
   * @param session - Checkout session (for amount limits)
   * @param input - Either PaymentMethod ID or raw card details
   * @returns SharedPaymentToken (spt_xxx)
   */
  async createSharedPaymentToken(
    session: CheckoutSession,
    input: {
      paymentMethodId?: string
      cardDetails?: {
        number: string
        exp_month: number
        exp_year: number
        cvc: string
      }
    }
  ): Promise<string> {
    try {
      let paymentMethodId: string
      
      if (input.paymentMethodId) {
        // Option 1: Use existing PaymentMethod (RECOMMENDED for testing)
        // Examples: pm_card_visa, pm_card_mastercard, pm_card_amex
        paymentMethodId = input.paymentMethodId
      } else if (input.cardDetails) {
        // Option 2: Create PaymentMethod from raw card (REQUIRES STRIPE SETTING)
        // ⚠️ Only use in test mode with "Allow raw card data" enabled
        const paymentMethod = await this.stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: input.cardDetails.number,
            exp_month: input.cardDetails.exp_month,
            exp_year: input.cardDetails.exp_year,
            cvc: input.cardDetails.cvc
          }
        })
        paymentMethodId = paymentMethod.id
      } else {
        throw new Error('Must provide either paymentMethodId or cardDetails')
      }
      
      // Step 2: Create test SharedPaymentToken (for testing only)
      // In production, ChatGPT/agent creates this, not the merchant
      // Using raw HTTP call because TypeScript types don't include SPT yet
      const response = await fetch('https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'payment_method': paymentMethodId,
          'usage_limits[currency]': session.totals.currency,
          'usage_limits[max_amount]': session.totals.total.toString(),
          'usage_limits[expires_at]': (Math.floor(Date.now() / 1000) + (30 * 60)).toString()
        })
      })
      
      if (!response.ok) {
        const error = await response.json() as any
        throw new Error(`Stripe API error: ${error.error?.message || 'Unknown error'}`)
      }
      
      const grantedToken = await response.json() as any
      return grantedToken.id as string
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Failed to create payment token: ${error.message}`)
      }
      throw error
    }
  }
  
  /**
   * Create Stripe Checkout Session for browser-based payment
   * 
   * THIS IS FOR NON-CHATGPT CLIENTS (Claude, Cursor, etc.):
   * - Generates a Stripe Checkout URL
   * - User completes payment in browser
   * - Supports cards, Apple Pay, Google Pay, Link, etc.
   * - PCI compliant (Stripe handles all payment collection)
   * 
   * @param session - Checkout session
   * @param successUrl - URL to redirect after successful payment
   * @param cancelUrl - URL to redirect if user cancels
   * @returns Stripe Checkout Session with payment URL
   */
  async createCheckoutSession(
    session: CheckoutSession,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<Stripe.Checkout.Session> {
    if (session.items.length === 0) {
      throw new Error('Cannot create checkout for empty cart')
    }
    
    if (!session.buyer?.email) {
      throw new Error('Buyer email is required for checkout')
    }
    
    // Convert cart items to Stripe line items
    const lineItems = session.items.map(item => ({
      price_data: {
        currency: session.totals.currency,
        unit_amount: item.price,
        product_data: {
          name: item.name,
          description: `Quantity: ${item.quantity}`
        }
      },
      quantity: item.quantity
    }))
    
    // Create Stripe Checkout Session
    const checkoutSession = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: session.buyer.email,
      
      // Success/cancel URLs
      // For testing: Use Stripe's test page (always works)
      // In production: Developer should provide their own URLs
      success_url: successUrl || 'https://stripe.com/docs/payments/checkout/accept-a-payment?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://stripe.com/docs/payments/checkout',
      
      // Payment method options
      payment_method_types: ['card'],
      
      // Enable Apple Pay, Google Pay, Link
      payment_method_options: {
        card: {
          setup_future_usage: undefined // One-time payment
        }
      },
      
      // Metadata for tracking
      metadata: {
        commerceSessionId: session.id,
        buyerEmail: session.buyer.email,
        itemCount: session.items.length.toString()
      },
      
      // Allow promotion codes
      allow_promotion_codes: true,
      
      // Billing address collection
      billing_address_collection: 'auto',
      
      // Expires in 1 hour
      expires_at: Math.floor(Date.now() / 1000) + 3600
    })
    
    return checkoutSession
  }
  
  /**
   * Process SharedPaymentToken (SPT)
   * 
   * THIS IS THE KEY ACP FEATURE:
   * - AI agent calls /checkouts/:id/complete with SPT
   * - SPT is a secure, time-limited token from Stripe
   * - We attach it to the PaymentIntent and confirm
   * - Payment happens without user entering card details
   * 
   * @param session - Checkout session
   * @param spt - SharedPaymentToken from AI agent
   * @returns Confirmed PaymentIntent
   */
  async processSharedPaymentToken(
    session: CheckoutSession, 
    spt: string
  ): Promise<Stripe.PaymentIntent> {
    // First, ensure we have a PaymentIntent
    let paymentIntentId = session.payment?.stripePaymentIntentId
    
    if (!paymentIntentId) {
      // Create new PaymentIntent if doesn't exist
      const pi = await this.createPaymentIntent(session)
      paymentIntentId = pi.id
    }
    
    try {
      // Attach the SPT to the PaymentIntent
      // This is Stripe's ACP-specific API
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          // The SharedPaymentToken acts as the payment method
          payment_method: spt,
          
          // Don't redirect (agents can't handle redirects)
          return_url: undefined
        }
      )
      
      return paymentIntent
    } catch (error) {
      // Handle Stripe errors
      if (error instanceof Stripe.errors.StripeError) {
        throw new Error(`Payment failed: ${error.message}`)
      }
      throw error
    }
  }
  
  /**
   * Verify webhook signature
   * 
   * WHY?
   * - Webhooks notify you of events (payment succeeded, failed, etc.)
   * - But anyone can POST to your webhook URL
   * - Signature verification proves it's really from Stripe
   * 
   * @param payload - Raw webhook body
   * @param signature - Stripe-Signature header
   * @returns Parsed webhook event
   */
  verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured')
    }
    
    try {
      // Stripe SDK verifies the signature and parses the event
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      )
      
      return event
    } catch (error) {
      throw new Error(`Webhook verification failed: ${(error as Error).message}`)
    }
  }
  
  /**
   * Create an Order from a successful payment
   * 
   * This converts a CheckoutSession into an Order after payment succeeds
   * 
   * @param session - Checkout session
   * @param paymentIntent - Confirmed PaymentIntent
   * @returns Order object
   */
  createOrderFromSession(
    session: CheckoutSession, 
    paymentIntent: Stripe.PaymentIntent
  ): Order {
    if (!session.buyer) {
      throw new Error('Buyer information required to create order')
    }
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment must be succeeded to create order')
    }
    
    const order: Order = {
      id: generateId('ord_'), // ord_ prefix for "order"
      sessionId: session.id,
      items: [...session.items], // Clone items
      buyer: session.buyer,
      totals: { ...session.totals }, // Clone totals
      payment: {
        stripePaymentIntentId: paymentIntent.id,
        status: 'succeeded',
        paidAt: new Date()
      },
      status: 'pending', // Awaiting fulfillment
      createdAt: new Date()
    }
    
    return order
  }
  
  /**
   * Get PaymentIntent by ID
   * 
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @returns PaymentIntent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId)
  }
  
  /**
   * Cancel a PaymentIntent
   * 
   * @param paymentIntentId - Stripe PaymentIntent ID
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.cancel(paymentIntentId)
  }
  
  /**
   * Refund a payment
   * 
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @param amount - Amount to refund in cents (optional, defaults to full refund)
   * @returns Stripe Refund
   */
  async refundPayment(
    paymentIntentId: string, 
    amount?: number
  ): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId
    }
    
    if (amount) {
      refundParams.amount = amount
    }
    
    return await this.stripe.refunds.create(refundParams)
  }
  
  /**
   * Get Stripe instance (for advanced usage)
   * Allows developers to use Stripe SDK directly if needed
   * 
   * @returns Stripe instance
   */
  getStripeInstance(): Stripe {
    return this.stripe
  }
}

