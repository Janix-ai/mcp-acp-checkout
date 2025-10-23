/**
 * Basic tests for CommerceTools
 * 
 * NOTE: These are placeholder tests showing the structure.
 * Full test suite would use Jest and include:
 * - Unit tests for each manager
 * - Integration tests with Stripe
 * - E2E tests with MCP server
 */

import { CommerceTools } from '../src/index.js'
import type { Product } from '../src/types/index.js'

// Test product catalog
const testProducts: Product[] = [
  {
    id: 'test-product-1',
    name: 'Test Product',
    description: 'A test product',
    price: 1000,
    currency: 'usd',
    type: 'digital'
  }
]

// Mock Stripe key (never use real keys in tests!)
const MOCK_STRIPE_KEY = 'sk_test_mock_key_for_testing'

describe('CommerceTools', () => {
  describe('initialization', () => {
    it('should create instance with valid config', () => {
      const commerce = new CommerceTools({
        products: testProducts,
        stripe: {
          secretKey: MOCK_STRIPE_KEY
        },
        onPurchase: async () => {}
      })
      
      expect(commerce).toBeDefined()
    })
    
    it('should throw error with invalid config', () => {
      expect(() => {
        new CommerceTools({
          products: [], // Empty products array
          stripe: { secretKey: MOCK_STRIPE_KEY },
          onPurchase: async () => {}
        })
      }).toThrow('At least one product is required')
    })
  })
  
  describe('session management', () => {
    let commerce: CommerceTools
    
    beforeEach(() => {
      commerce = new CommerceTools({
        products: testProducts,
        stripe: { secretKey: MOCK_STRIPE_KEY },
        onPurchase: async () => {}
      })
    })
    
    it('should create checkout session', () => {
      const session = commerce.createSession()
      
      expect(session.id).toMatch(/^cs_/)
      expect(session.status).toBe('pending')
      expect(session.items).toHaveLength(0)
    })
    
    it('should add item to cart', () => {
      const session = commerce.createSession()
      const updated = commerce.addToCart(session.id, 'test-product-1', 1)
      
      expect(updated.items).toHaveLength(1)
      expect(updated.items[0].productId).toBe('test-product-1')
      expect(updated.status).toBe('ready')
    })
    
    it('should calculate totals correctly', () => {
      const session = commerce.createSession()
      const updated = commerce.addToCart(session.id, 'test-product-1', 2)
      
      expect(updated.totals.subtotal).toBe(2000) // 2 * 1000
      expect(updated.totals.total).toBe(2000)
    })
    
    it('should set buyer information', () => {
      const session = commerce.createSession()
      const updated = commerce.setBuyer(session.id, {
        email: 'test@example.com',
        name: 'Test User'
      })
      
      expect(updated.buyer?.email).toBe('test@example.com')
      expect(updated.buyer?.name).toBe('Test User')
    })
  })
  
  describe('product search', () => {
    let commerce: CommerceTools
    
    beforeEach(() => {
      commerce = new CommerceTools({
        products: [
          {
            id: 'ebook-1',
            name: 'TypeScript Guide',
            description: 'Learn TypeScript',
            price: 2999,
            currency: 'usd',
            type: 'digital',
            tags: ['typescript', 'tutorial']
          },
          {
            id: 'ebook-2',
            name: 'React Guide',
            description: 'Learn React',
            price: 3999,
            currency: 'usd',
            type: 'digital',
            tags: ['react', 'tutorial']
          }
        ],
        stripe: { secretKey: MOCK_STRIPE_KEY },
        onPurchase: async () => {}
      })
    })
    
    it('should return all products without query', () => {
      const results = commerce.searchProducts()
      expect(results).toHaveLength(2)
    })
    
    it('should filter products by name', () => {
      const results = commerce.searchProducts('TypeScript')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('ebook-1')
    })
    
    it('should filter products by description', () => {
      const results = commerce.searchProducts('React')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('ebook-2')
    })
  })
  
  describe('MCP tools', () => {
    let commerce: CommerceTools
    
    beforeEach(() => {
      commerce = new CommerceTools({
        products: testProducts,
        stripe: { secretKey: MOCK_STRIPE_KEY },
        onPurchase: async () => {}
      })
    })
    
    it('should return 10 MCP tools', () => {
      const tools = commerce.getMCPTools()
      expect(tools).toHaveLength(10)
    })
    
    it('should have correct tool names', () => {
      const tools = commerce.getMCPTools()
      const names = tools.map(t => t.name)
      
      expect(names).toContain('search_products')
      expect(names).toContain('create_checkout')
      expect(names).toContain('add_to_cart')
      expect(names).toContain('set_buyer_info')
      expect(names).toContain('complete_checkout')
      expect(names).toContain('get_checkout_status')
    })
    
    it('should execute search_products tool', async () => {
      const tools = commerce.getMCPTools()
      const searchTool = tools.find(t => t.name === 'search_products')!
      
      const result = await searchTool.execute({})
      
      expect(result.content).toBeDefined()
      expect(result.content[0].type).toBe('text')
    })
  })
})

// Note: To run these tests, you'd need:
// 1. Jest configured (jest.config.js)
// 2. ts-jest for TypeScript support
// 3. Mock Stripe SDK to avoid real API calls
// 4. Run: npm test

