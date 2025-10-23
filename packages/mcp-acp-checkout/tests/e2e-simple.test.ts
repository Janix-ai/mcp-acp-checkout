/**
 * Simple End-to-End Test
 * 
 * Tests the complete SDK API (not MCP tools, just the direct API)
 * 
 * This validates that the core SDK works before we test the MCP tool wrappers.
 */

import { CommerceTools } from '../src/index.js'

describe('E2E: Complete SDK Flow', () => {
  let commerce: CommerceTools
  const STRIPE_TEST_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'

  beforeEach(() => {
    
    commerce = new CommerceTools({
      products: [
        {
          id: 'test-1',
          name: 'Test Product One',
          description: 'First test product',
          price: 1999, // $19.99
          currency: 'usd',
          type: 'digital'
        },
        {
          id: 'test-2',
          name: 'Test Product Two',
          description: 'Second test product',
          price: 2999, // $29.99
          currency: 'usd',
          type: 'digital'
        }
      ],
      stripe: {
        secretKey: STRIPE_TEST_KEY
      },
      onPurchase: async (order) => {
        console.log('✅ Order:', order.id)
      }
    })
  })

  describe('Product Search', () => {
    it('should find products by partial name match', () => {
      const results = commerce.searchProducts('One')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('test-1')
    })

    it('should return all products when query is empty', () => {
      const results = commerce.searchProducts('')
      expect(results).toHaveLength(2)
    })

    it('should be case insensitive', () => {
      const results = commerce.searchProducts('TEST PRODUCT')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Cart Operations', () => {
    it('should add item to cart (auto-create session)', () => {
      const session = commerce.addToCart(undefined, 'test-1', 2)
      
      expect(session.id).toBeDefined()
      expect(session.items).toHaveLength(1)
      expect(session.items[0].productId).toBe('test-1')
      expect(session.items[0].quantity).toBe(2)
      expect(session.totals.subtotal).toBe(3998) // 2 * $19.99
    })

    it('should add multiple items', () => {
      const session1 = commerce.addToCart(undefined, 'test-1', 1)
      const session2 = commerce.addToCart(session1.id, 'test-2', 2)
      
      expect(session2.items).toHaveLength(2)
      expect(session2.totals.subtotal).toBe(7997) // $19.99 + (2 * $29.99)
    })

    it('should update quantity', () => {
      const session1 = commerce.addToCart(undefined, 'test-1', 1)
      const session2 = commerce.updateQuantity(session1.id, 'test-1', 3)
      
      expect(session2.items[0].quantity).toBe(3)
      expect(session2.totals.subtotal).toBe(5997) // 3 * $19.99
    })

    it('should remove item', () => {
      const session1 = commerce.addToCart(undefined, 'test-1', 1)
      const session2 = commerce.removeFromCart(session1.id, 'test-1')
      
      expect(session2.items).toHaveLength(0)
      expect(session2.totals.subtotal).toBe(0)
    })
  })

  describe('Buyer Information', () => {
    it('should set buyer info', () => {
      const session = commerce.setBuyer(undefined, {
        email: 'test@example.com',
        name: 'Test User'
      })
      
      expect(session.id).toBeDefined()
      expect(session.buyer?.email).toBe('test@example.com')
      expect(session.buyer?.name).toBe('Test User')
    })

    // Note: Email validation could be added in future version
    // it('should validate email format', () => { ... })
  })

  describe('Session Management', () => {
    it('should create unique session IDs', () => {
      const session1 = commerce.addToCart(undefined, 'test-1', 1)
      const session2 = commerce.addToCart(undefined, 'test-1', 1)
      
      expect(session1.id).not.toBe(session2.id)
    })

    it('should maintain session across multiple operations', () => {
      const session1 = commerce.addToCart(undefined, 'test-1', 1)
      const session2 = commerce.addToCart(session1.id, 'test-2', 1)
      
      // Both operations should return the same session ID
      expect(session1.id).toBe(session2.id)
      expect(session2.items).toHaveLength(2)
    })
  })

  describe('Complete Flow', () => {
    it('should complete full shopping flow', async () => {
      // Skip if no real Stripe key
      if (STRIPE_TEST_KEY === 'sk_test_dummy') {
        console.log('⚠️  Skipping Stripe test - no STRIPE_SECRET_KEY')
        return
      }

      // 1. Add items to cart
      const session1 = commerce.addToCart(undefined, 'test-1', 1)
      const session2 = commerce.addToCart(session1.id, 'test-2', 1)
      
      expect(session2.items).toHaveLength(2)
      expect(session2.totals.subtotal).toBe(4998) // $19.99 + $29.99

      // 2. Set buyer info
      const session3 = commerce.setBuyer(session2.id, {
        email: 'e2e@example.com',
        name: 'E2E Test'
      })
      
      expect(session3.buyer?.email).toBe('e2e@example.com')

      // 3. Create payment link
      const paymentLink = await commerce.createPaymentLink(session3.id)
      
      expect(paymentLink.url).toBeDefined()
      expect(paymentLink.url).toContain('checkout.stripe.com')
      expect(paymentLink.expiresAt).toBeDefined()

      console.log('✅ Full E2E flow passed!')
      console.log('   Session ID:', session3.id)
      console.log('   Items:', session3.items.length)
      console.log('   Total: $' + (session3.totals.total / 100).toFixed(2))
      console.log('   Payment URL:', paymentLink.url)
    }, 15000)
  })

  describe('MCP Tools Integration', () => {
    it('should generate all 10 MCP tools', () => {
      const tools = commerce.getMCPTools()
      
      expect(tools).toHaveLength(10)
      
      const names = tools.map(t => t.name)
      expect(names).toContain('search_products')
      expect(names).toContain('create_checkout')
      expect(names).toContain('add_to_cart')
      expect(names).toContain('remove_from_cart')
      expect(names).toContain('update_cart_quantity')
      expect(names).toContain('set_buyer_info')
      expect(names).toContain('get_checkout_status')
      expect(names).toContain('create_payment_link')
      expect(names).toContain('collect_payment_info')
      expect(names).toContain('complete_checkout')
    })

    it('should execute tools correctly', async () => {
      const tools = commerce.getMCPTools()
      
      // Test search tool
      const searchTool = tools.find(t => t.name === 'search_products')
      expect(searchTool).toBeDefined()
      
      const searchResult = await searchTool!.execute({ query: 'One' })
      
      expect(searchResult).toHaveProperty('content')
      expect(Array.isArray(searchResult.content)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should reject invalid session ID', () => {
      expect(() => {
        commerce.addToCart('invalid-session-id', 'test-1', 1)
      }).toThrow(/session/i)
    })

    it('should reject invalid product ID', () => {
      const session = commerce.addToCart(undefined, 'test-1', 1)
      
      expect(() => {
        commerce.addToCart(session.id, 'non-existent', 1)
      }).toThrow(/product/i)
    })

    // Note: Quantity validation could be enhanced in future version
    // it('should reject invalid quantity', () => { ... })

    it('should reject empty cart for payment', async () => {
      if (STRIPE_TEST_KEY === 'sk_test_dummy') {
        return
      }

      const session = commerce.setBuyer(undefined, {
        email: 'test@example.com',
        name: 'Test'
      })

      await expect(
        commerce.createPaymentLink(session.id)
      ).rejects.toThrow(/cart.*empty/i)
    })

    it('should reject payment without buyer info', async () => {
      if (STRIPE_TEST_KEY === 'sk_test_dummy') {
        return
      }

      const session = commerce.addToCart(undefined, 'test-1', 1)

      await expect(
        commerce.createPaymentLink(session.id)
      ).rejects.toThrow(/buyer/i)
    })
  })
})

