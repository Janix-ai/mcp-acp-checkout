# mcp-acp-checkout

[![npm version](https://img.shields.io/npm/v/mcp-acp-checkout)](https://www.npmjs.com/package/mcp-acp-checkout)
[![license](https://img.shields.io/npm/l/mcp-acp-checkout)](https://github.com/Janix-ai/mcp-acp-checkout/blob/main/LICENSE)

**Add ACP-compliant checkout to any MCP server. Works with Claude, Cursor, ChatGPT, and any MCP client.**

Built on **Stripe** and the **Agentic Commerce Protocol (ACP)**.

---

## 🎯 What This Does

Enable AI agents to purchase from your MCP server:
- 🛒 Shopping cart management
- 💳 Secure Stripe payments  
- 🌐 Browser checkout (cards, Apple Pay, Google Pay, Link)
- 🤖 Works with Claude Desktop, Cursor, ChatGPT
- ✅ ACP-compliant for ChatGPT Apps
- 🔒 PCI compliant - your server never sees card data

---

## ⚡ Quick Start

**This is a library you install into YOUR MCP server.**

### 1. Install the SDK

```bash
npm install mcp-acp-checkout
```

### 2. Add to Your MCP Server

```typescript
import { CommerceTools } from 'mcp-acp-checkout'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

// Initialize commerce with your products
const commerce = new CommerceTools({
  products: [
    {
      id: 'my-product',
      name: 'My Digital Product',
      price: 2999, // $29.99 in cents
      currency: 'usd',
      type: 'digital'
    }
  ],
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY
  },
  onPurchase: async (order) => {
    // Your fulfillment logic here
    await sendProductToCustomer(order.buyer.email, order.items)
  }
})

// Get the commerce tools
const tools = commerce.getMCPTools()

// Register with your MCP server
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema
  }))
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name)
  return await tool.execute(request.params.arguments || {})
})
```

### 3. That's It!

Your MCP server now has a complete shopping cart and checkout system.

---

## 📦 Repository Structure

This is a **monorepo** containing:

```
mcp-acp-checkout/
├── packages/
│   └── mcp-acp-checkout/  # 📦 THE SDK (what you install)
│       ├── src/           # SDK source code
│       ├── dist/          # Compiled SDK (published to npm)
│       └── README.md      # Full SDK documentation
│
└── examples/              # 📚 Example implementations
    └── demo-shop/         # Complete working MCP server
        ├── server/        # Shows how to use the SDK
        ├── web/           # Optional ChatGPT UI
        └── README.md      # How to run this example
```

**You only install the SDK** (`npm install mcp-acp-checkout`)  
**The examples show you how to use it in YOUR server**

---

## 🚀 Getting Started

### I Want to Add Commerce to My MCP Server

**👉 Start here:** [`packages/mcp-acp-checkout/README.md`](./packages/mcp-acp-checkout/README.md)

Complete SDK documentation with API reference and integration guide.

**Quick setup:**
```bash
npm install mcp-acp-checkout
```

Then add to your server (see Quick Start above).

### I Want to See a Working Example First

**👉 Start here:** [`examples/demo-shop/README.md`](./examples/demo-shop/README.md)

A complete reference implementation you can:
- Run locally with Claude Desktop
- Study to understand the integration
- Use as a starting point for your own server

**Note:** This is just an example! You'll integrate the SDK into YOUR OWN server.

---

## 🎨 Features

### 10 MCP Tools

1. **`search_products`** - Browse your catalog
2. **`create_checkout`** - Start a new session (optional - auto-creates)
3. **`add_to_cart`** - Add items to cart
4. **`remove_from_cart`** - Remove items
5. **`update_cart_quantity`** - Change quantities
6. **`set_buyer_info`** - Set email, name, address
7. **`get_checkout_status`** - View cart & totals
8. **`create_payment_link`** - Generate Stripe Checkout URL (recommended)
9. **`collect_payment_info`** - For testing ACP flow
10. **`complete_checkout`** - Complete ACP purchase (ChatGPT Apps)

### Dual Payment Flows

**🌐 Stripe Checkout** (Recommended for Claude/Cursor)
- Browser-based payment page
- Supports cards, Apple Pay, Google Pay, Link
- PCI compliant
- Works with any MCP client

**🤖 ACP/SharedPaymentToken** (ChatGPT Apps)
- ChatGPT collects payment info securely
- Generates SharedPaymentToken
- Your server completes purchase
- ACP-compliant

---

## 🧪 Tested & Working

✅ Full end-to-end payment flow tested  
✅ Works with Claude Desktop  
✅ Works with Cursor  
✅ Works with ChatGPT (ACP-compliant)  
✅ Real Stripe Checkout integration  
✅ Test mode verified  
✅ 29 automated tests passing

---

## 📚 Documentation

- **[SDK README](./packages/mcp-acp-checkout/README.md)** - Full API docs
- **[Demo Shop](./examples/demo-shop/README.md)** - Working example
- **[Getting Started](./packages/mcp-acp-checkout/GETTING-STARTED.md)** - Step-by-step guide
- **[Payment Flows](./packages/mcp-acp-checkout/PAYMENT-FLOWS.md)** - How payments work
- **[Security](./packages/mcp-acp-checkout/SECURITY.md)** - Security guidelines
- **[Testing Guide](./examples/demo-shop/TESTING-GUIDE.md)** - How to test

---

## 🌟 Why Use This SDK?

**Add commerce to your MCP server quickly and easily.**

### Without this SDK:
- ❌ Build shopping cart from scratch
- ❌ Implement ACP protocol yourself
- ❌ Integrate Stripe payment flows
- ❌ Handle session management
- ❌ Test across multiple AI clients
- ❌ Deal with edge cases and errors

### With this SDK:
```typescript
npm install mcp-acp-checkout

import { CommerceTools } from 'mcp-acp-checkout'
const commerce = new CommerceTools({ products, stripe, onPurchase })
const tools = commerce.getMCPTools()
```

**Get working commerce with minimal code.** ✨

---

## 🛠️ Development

### Build the SDK

```bash
cd packages/mcp-acp-checkout
npm install
npm run build
```

### Run the Demo

```bash
cd examples/demo-shop
npm install
npm run build
npm run dev
```

### Test with Claude Desktop

See [`examples/demo-shop/QUICK-TEST.md`](./examples/demo-shop/QUICK-TEST.md)

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./packages/mcp-acp-checkout/CONTRIBUTING.md) first.

### Development Setup

```bash
git clone https://github.com/Janix-ai/mcp-acp-checkout.git
cd mcp-acp-checkout
npm install
npm run build
```

---

## 📄 License

MIT - see [LICENSE](./packages/mcp-acp-checkout/LICENSE)

---

## 🙏 Built With

- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)** by Anthropic
- **[Agentic Commerce Protocol (ACP)](https://stripe.com/acp)** by OpenAI & Stripe
- **[Stripe](https://stripe.com/)** for payments
- **TypeScript** for type safety

---

## 🔗 Links

- **npm:** [npmjs.com/package/mcp-acp-checkout](https://www.npmjs.com/package/mcp-acp-checkout)
- **GitHub:** [github.com/Janix-ai/mcp-acp-checkout](https://github.com/Janix-ai/mcp-acp-checkout)
- **Issues:** [github.com/Janix-ai/mcp-acp-checkout/issues](https://github.com/Janix-ai/mcp-acp-checkout/issues)

---

## ⭐ Star This Repo!

If you find this useful, please give it a star! It helps others discover the project.

---

**Made with ❤️ for the AI agent community**

