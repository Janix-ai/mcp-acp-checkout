/**
 * Minimal Example - Just the Essentials
 * 
 * This is the absolute minimal code to get commerce working in your MCP server.
 * Perfect for quick start and testing.
 */

import { CommerceTools } from '../src/index.js'

// 1. Create commerce instance
const commerce = new CommerceTools({
  products: [
    {
      id: 'my-product',
      name: 'My Digital Product',
      description: 'An awesome product',
      price: 2999, // $29.99 in cents
      currency: 'usd',
      type: 'digital'
    }
  ],
  stripe: {
    secretKey: 'sk_test_your_key_here'
  },
  onPurchase: async (order) => {
    console.log('New order:', order.id)
    // Fulfill the order here
  }
})

// 2. Get tools for your MCP server
const tools = commerce.getMCPTools()

// 3. That's it! Add these tools to your MCP server
console.log(`Created ${tools.length} commerce tools:`)
tools.forEach(tool => {
  console.log(`  - ${tool.name}: ${tool.description}`)
})

// Example: Manual testing (without MCP server)
async function testFlow() {
  console.log('\n🧪 Testing commerce flow...\n')
  
  // 1. Create session
  const session = commerce.createSession()
  console.log('✓ Created session:', session.id)
  
  // 2. Add product to cart
  const updatedSession = commerce.addToCart(session.id, 'my-product', 1)
  console.log('✓ Added to cart:', updatedSession.items[0].name)
  console.log('  Total:', `$${(updatedSession.totals.total / 100).toFixed(2)}`)
  
  // 3. Set buyer info
  commerce.setBuyer(session.id, {
    email: 'customer@example.com',
    name: 'Test Customer'
  })
  console.log('✓ Set buyer info')
  
  // 4. In real usage, AI agent would call:
  // await commerce.completeCheckout(session.id, sharedPaymentToken)
  console.log('\n💡 Next step: AI agent calls completeCheckout with SharedPaymentToken')
}

// Uncomment to test:
// testFlow()

