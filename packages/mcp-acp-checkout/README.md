# mcp-acp-checkout

[![npm version](https://img.shields.io/npm/v/mcp-acp-checkout)](https://www.npmjs.com/package/mcp-acp-checkout)
[![license](https://img.shields.io/npm/l/mcp-acp-checkout)](https://github.com/Janix-ai/mcp-acp-checkout/blob/main/LICENSE)

**Add ACP-compliant checkout to any MCP server.** Works with Claude, Cursor, ChatGPT, and any MCP client.

Built on **Stripe** and the **Agentic Commerce Protocol (ACP)**.

## 🎯 What This Does

Add checkout and payments to your MCP server in **5 minutes**. AI agents can:
- Browse your products
- Add items to cart  
- Complete purchases securely with Stripe
- Works across **Claude Desktop**, **Cursor**, **ChatGPT**, and any MCP client

## ⚡ Quick Start

### 1. Install

```bash
npm install mcp-acp-checkout
```

### 2. Add to Your MCP Server

```typescript
import { CommerceTools } from 'mcp-acp-checkout'

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
    secretKey: process.env.STRIPE_SECRET_KEY
  },
  onPurchase: async (order) => {
    console.log('New order!', order.id)
    // Fulfill the order (send download link, etc.)
  }
})

// Get commerce tools
const tools = commerce.getMCPTools()

// Add to your MCP server (see examples for full integration)
```

### 3. Configure in Claude/Cursor

```json
{
  "mcpServers": {
    "my-store": {
      "command": "node",
      "args": ["path/to/your-server.js"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

### 4. Done!

AI agents can now:
- "Show me what products are available"
- "Add the ebook to my cart"
- "Complete my purchase"

## 📚 Full Example

See [`examples/basic-server.ts`](./examples/basic-server.ts) for a complete working example.

```bash
# Run the example
npm install
export STRIPE_SECRET_KEY=sk_test_...
tsx examples/basic-server.ts
```

## 🛠️ API Reference

### `CommerceTools`

Main SDK class.

#### Constructor

```typescript
new CommerceTools(config: CommerceConfig)
```

**Config:**

```typescript
{
  // Product catalog (required)
  products: Product[]
  
  // Stripe configuration (required)
  stripe: {
    secretKey: string
    webhookSecret?: string
  }
  
  // Purchase callback (required)
  onPurchase: (order: Order) => Promise<void> | void
  
  // Optional: Session configuration
  session?: {
    storage: 'memory' | 'redis'
    ttl: number // seconds
  }
  
  // Optional: Tax calculation
  tax?: {
    calculate: (address, subtotal) => Promise<number> | number
  }
  
  // Optional: Shipping calculation
  shipping?: {
    calculate: (address, items) => Promise<number> | number
  }
}
```

#### Methods

##### `getMCPTools(): MCPTool[]`

Get MCP tools to add to your server.

Returns 6 tools:
- `search_products` - Search product catalog
- `create_checkout` - Create checkout session
- `add_to_cart` - Add item to cart
- `set_buyer_info` - Set buyer information
- `complete_checkout` - Complete purchase with payment
- `get_checkout_status` - Get session details

##### `createSession(): CheckoutSession`

Create a new checkout session.

##### `getSession(sessionId: string): CheckoutSession | null`

Get a checkout session by ID.

##### `addToCart(sessionId, productId, quantity?): CheckoutSession`

Add product to cart.

##### `setBuyer(sessionId, buyer): CheckoutSession`

Set buyer information.

##### `completeCheckout(sessionId, sharedPaymentToken): Promise<Order>`

Complete checkout with Stripe SharedPaymentToken.

This is called by AI agents with the SPT from the user.

##### `searchProducts(query?: string): Product[]`

Search products. Returns all if no query provided.

## 📦 Product Definition

```typescript
interface Product {
  id: string              // Unique ID
  name: string           // Product name
  description: string    // Full description
  price: number          // Price in cents (2999 = $29.99)
  currency: Currency     // 'usd' | 'eur' | 'gbp' | 'cad' | 'aud'
  type: ProductType      // 'digital' | 'physical'
  
  // Optional
  image?: string         // Main image URL
  images?: string[]      // Additional images
  category?: string      // Category
  tags?: string[]        // Search tags
  metadata?: object      // Custom data
}
```

## 🔐 Security

### Stripe Integration

- Uses **SharedPaymentToken (SPT)** for secure, AI-agent-friendly payments
- No direct card data handling (PCI compliant)
- Built on official Stripe SDK

### Session Management

- Automatic session expiration (default: 1 hour)
- In-memory storage for development
- Redis support for production (coming soon)

### Best Practices

1. **Never commit Stripe keys** - Use environment variables
2. **Validate in `onPurchase`** - Double-check order before fulfillment
3. **Use webhook signatures** - Verify Stripe webhooks
4. **Test with test keys** - Use `sk_test_...` during development

## 🌍 Works With

✅ **Claude Desktop** (Anthropic)  
✅ **Cursor** (Anysphere)  
✅ **ChatGPT** (OpenAI Apps SDK)  
✅ Any MCP-compatible client

## 🏗️ Architecture

```
┌─────────────────┐
│   AI Assistant  │ (Claude, Cursor, ChatGPT)
│   (User's PC)   │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│   Your Server   │
│mcp-acp-checkout│
└────────┬────────┘
         │ Stripe API
         │
┌────────▼────────┐
│     Stripe      │
│   (Payments)    │
└─────────────────┘
```

### How Payment Works

1. AI agent creates checkout session
2. User adds products to cart
3. Agent collects buyer email
4. Agent requests **SharedPaymentToken (SPT)** from Stripe via user
5. Agent calls `complete_checkout` with SPT
6. SDK processes payment via Stripe
7. `onPurchase` callback triggered
8. You fulfill the order

## 📖 TypeScript Guide

New to TypeScript? Check out [`TYPESCRIPT-GUIDE.md`](../../codegen/TYPESCRIPT-GUIDE.md) for a complete tutorial.

Key points:
- TypeScript = JavaScript + Types
- Types catch errors before runtime
- Better autocomplete in your editor
- Self-documenting code

## 🧪 Testing

```bash
# Run tests
npm test

# Build
npm run build

# Watch mode (during development)
npm run dev
```

## 🗺️ Roadmap

### v0.1.0 (MVP) ✅
- [x] Core SDK with session management
- [x] Stripe integration with SPT
- [x] MCP tools (6 tools)
- [x] In-memory storage
- [x] TypeScript support

### v0.2.0 (Coming Soon)
- [ ] Redis session storage
- [ ] Product feed generation
- [ ] Webhook handling helpers
- [ ] Tax/shipping calculators
- [ ] Order fulfillment tracking

### v0.3.0 (Future)
- [ ] ChatGPT UI components
- [ ] Multi-currency support
- [ ] Subscription products
- [ ] Discount codes
- [ ] Analytics dashboard

## 💡 Examples

### Digital Products (E-books, Courses)

```typescript
const commerce = new CommerceTools({
  products: [
    {
      id: 'course-1',
      name: 'MCP Development Course',
      description: 'Learn to build MCP servers',
      price: 9900,
      currency: 'usd',
      type: 'digital',
      tags: ['course', 'tutorial']
    }
  ],
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY },
  onPurchase: async (order) => {
    // Send course access email
    await sendCourseAccess(order.buyer.email, 'course-1')
  }
})
```

### Services (Consulting, Coaching)

```typescript
const commerce = new CommerceTools({
  products: [
    {
      id: 'consulting-1hr',
      name: '1-Hour Consulting Session',
      description: 'Expert guidance for your project',
      price: 25000,
      currency: 'usd',
      type: 'digital',
      category: 'Services'
    }
  ],
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY },
  onPurchase: async (order) => {
    // Schedule session
    await calendly.createBooking(order.buyer.email, 'consulting-1hr')
  }
})
```

### SaaS Credits

```typescript
const commerce = new CommerceTools({
  products: [
    {
      id: 'credits-100',
      name: '100 API Credits',
      description: 'Credits for API usage',
      price: 1000,
      currency: 'usd',
      type: 'digital'
    }
  ],
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY },
  onPurchase: async (order) => {
    // Add credits to user account
    await database.addCredits(order.buyer.email, 100)
  }
})
```

## 🤝 Contributing

Contributions welcome! This is open source.

### Development

```bash
# Clone repo
git clone https://github.com/Janix-ai/mcp-acp-checkout.git
cd mcp-acp-checkout

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/Janix-ai/mcp-acp-checkout/issues)
- **Docs:** [Full Documentation](https://github.com/Janix-ai/mcp-acp-checkout)
- **Email:** scott@janix.ai

## 🙏 Credits

Built with:
- [MCP SDK](https://github.com/anthropics/mcp-sdk) by Anthropic
- [Stripe](https://stripe.com) for payments
- TypeScript

## ⭐ Show Your Support

If this SDK helps you, please:
- ⭐ Star the repo
- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve docs
- 🔀 Submit PRs

---

**Made with ❤️ for the MCP community**

