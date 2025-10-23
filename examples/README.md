# Examples

This directory contains example implementations showing how to use `mcp-acp-checkout` in your MCP server.

## 📚 Available Examples

### [demo-shop/](./demo-shop/)
**Complete MCP commerce server**

A full-featured example showing:
- Product catalog management
- Complete integration with the SDK
- Both Stripe Checkout and ACP payment flows
- Optional ChatGPT UI components
- Session management
- Order fulfillment callbacks

**Use this to:**
- See a working implementation
- Understand how to structure your server
- Test the SDK locally before building yours
- Copy patterns for your own server

---

## 🚀 How to Use These Examples

### 1. Study the Code
Look at how the SDK is integrated:
- How `CommerceTools` is initialized
- How MCP tools are registered
- How products are configured
- How payments are handled

### 2. Run Locally
Test the example with Claude Desktop or Cursor:
```bash
cd demo-shop
npm install
npm run build
# Configure Claude Desktop to use it
```

### 3. Build Your Own
Install the SDK in YOUR server:
```bash
npm install mcp-acp-checkout
```

Then adapt the patterns from the example for your use case.

---

## 💡 Integration Patterns

### Minimal Integration
```typescript
import { CommerceTools } from 'mcp-acp-checkout'

const commerce = new CommerceTools({
  products: [...],
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY },
  onPurchase: async (order) => { /* your logic */ }
})

const tools = commerce.getMCPTools()
// Register tools with your MCP server
```

### With All Options
See `demo-shop/server/src/index.ts` for:
- Session configuration
- Error handling
- Webhook setup
- UI components (ChatGPT)
- Logging and monitoring

---

## 📖 Documentation

- **SDK Documentation:** [packages/mcp-acp-checkout/README.md](../packages/mcp-acp-checkout/README.md)
- **Getting Started Guide:** [packages/mcp-acp-checkout/GETTING-STARTED.md](../packages/mcp-acp-checkout/GETTING-STARTED.md)
- **Payment Flows:** [packages/mcp-acp-checkout/PAYMENT-FLOWS.md](../packages/mcp-acp-checkout/PAYMENT-FLOWS.md)
- **Security:** [packages/mcp-acp-checkout/SECURITY.md](../packages/mcp-acp-checkout/SECURITY.md)

---

## 🤔 Which Example Should I Use?

**If you want to:**
- See a complete implementation → `demo-shop/`
- Understand all features → `demo-shop/`
- Test locally first → `demo-shop/`
- Copy and customize → `demo-shop/`

**Then:**
- Build YOUR OWN server with the SDK installed
- Customize for YOUR products and business logic
- Deploy YOUR server (not the example!)

---

## ⚠️ Important Note

**These are EXAMPLES, not products to deploy!**

The examples show you HOW to use the SDK. You need to:
1. Install `mcp-acp-checkout` in YOUR project
2. Build YOUR OWN MCP server
3. Add YOUR products and fulfillment logic
4. Deploy YOUR server

The SDK (`mcp-acp-checkout`) is what you actually use in production.

