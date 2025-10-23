# Demo Shop - Reference Implementation

**⚠️ This is an EXAMPLE showing how to use the SDK. You'll build YOUR OWN server.**

This is a complete reference implementation of an MCP server using `mcp-acp-checkout`. Study this to understand how to integrate the SDK into your own MCP server.

## What This Is

- ✅ **Example code** showing SDK integration
- ✅ **Reference implementation** you can study
- ✅ **Working demo** you can test locally
- ✅ **Starting point** for your own server

## What This Is NOT

- ❌ **NOT a product you deploy** - You build your own!
- ❌ **NOT the SDK itself** - The SDK is `npm install mcp-acp-checkout`
- ❌ **NOT production-ready as-is** - Customize for your needs

## Project Structure

```
demo-shop/
├── server/          # MCP server implementation
│   ├── src/
│   │   ├── index.ts        # Main server code
│   │   └── products.ts     # Product catalog
│   ├── dist/              # Compiled JavaScript
│   └── package.json
├── web/            # UI components for ChatGPT
│   ├── src/
│   │   ├── cart-widget.ts  # Shopping cart component
│   │   └── cart-widget.css # Styles
│   ├── dist/              # Compiled bundle
│   └── package.json
└── package.json    # Root package scripts
```

This structure follows the **OpenAI Apps SDK examples** pattern with separate `server/` and `web/` directories.

## Features

- 🛒 **Shopping cart management** - Add/remove items, update quantities
- 💳 **Universal payments** - Stripe Checkout (browser) + ACP/SharedPaymentToken (ChatGPT)
- 🌐 **Browser checkout** - Supports cards, Apple Pay, Google Pay, Link
- 🔍 **Product search** - Browse and search your catalog
- 🤖 **Multi-agent support** - Works with Claude Desktop, Cursor, and ChatGPT
- 🎨 **ChatGPT UI** - Interactive cart widget for ChatGPT users
- ⚡ **Auto-session creation** - No explicit setup needed, just start shopping
- 🧪 **Full test flow** - Complete purchases end-to-end with real Stripe Checkout
- 🔒 **PCI compliant** - Your server never sees card data
- 📦 **Easy setup** - Configure products and start selling in minutes

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Everything

```bash
npm run build
```

This builds both the web components and the server.

### 3. Get Stripe API Key

1. Create account at [stripe.com](https://stripe.com)
2. Get test key from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
3. Copy the **Secret key** (starts with `sk_test_...`)

### 4. Configure Claude Desktop

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "commerce": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-commerce-server/server/dist/index.js"
      ],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your_key_here"
      }
    }
  }
}
```

### 5. Restart Claude Desktop

Fully quit (Cmd+Q) and reopen Claude.

### 6. Test It!

**Simple query:**
```
What products are available?
```

**Complete purchase flow (Stripe Checkout - RECOMMENDED):**
```
I want to buy the MCP Development Basics ebook. 
My email is scott@janix.ai.
```

Claude will automatically:
1. Search for the product
2. Create a session and add to cart
3. Set your buyer information
4. **Generate a Stripe Checkout URL**
5. You open the link in browser
6. Complete payment with test card `4242 4242 4242 4242`
7. Get order confirmation!

**Quick test flow (development only):**
```
I want to buy the MCP Development Basics ebook. 
My email is test@example.com.
Use payment method pm_card_visa.
```

This simulates the ACP flow using Stripe test tokens.

## Development

### Build Commands

```bash
# Build everything
npm run build

# Build only web components
npm run build:web

# Build only server
npm run build:server

# Watch mode for web
npm run dev:web

# Run server in dev mode
npm run dev:server
```

### Project Layout

**`server/`** - MCP Server
- Uses `McpServer` from `@modelcontextprotocol/sdk`
- Registers tools and resources
- Integrates with `mcp-acp-checkout` SDK
- Serves compiled web components to ChatGPT

**`web/`** - UI Components
- Built with Vite
- TypeScript components
- Compiled to standalone JS bundle
- Loaded by server and served to ChatGPT

## Customization

### Add Your Own Products

Edit `server/src/products.ts`:

```typescript
export const products: Product[] = [
  {
    id: 'my-product',
    name: 'My Product',
    description: 'Product description',
    price: 2999, // $29.99 in cents
    currency: 'usd',
    type: 'digital'
  }
]
```

Then rebuild:
```bash
npm run build:server
```

### Customize the Cart UI

Edit `web/src/cart-widget.ts` and `web/src/cart-widget.css`, then:

```bash
npm run build:web
```

### Add Fulfillment Logic

Edit the `onPurchase` callback in `server/src/index.ts`:

```typescript
onPurchase: async (order: Order) => {
  // Your fulfillment logic here
  await sendEmail(order.buyer.email, order.items)
  await grantAccess(order.buyer.email, order.items)
}
```

## MCP Tools

The server exposes 8 tools:

1. **`search_products`** - Browse/search products
2. **`create_checkout`** - Start shopping session (auto-created, rarely needed)
3. **`add_to_cart`** - Add items (auto-creates session, shows UI in ChatGPT)
4. **`set_buyer_info`** - Set email/name (auto-creates session)
5. **`create_payment_link`** - **Generate Stripe Checkout URL (RECOMMENDED for Claude/Cursor)**
6. **`collect_payment_info`** - Create test payment token (development only)
7. **`complete_checkout`** - Process payment with SharedPaymentToken (ACP/ChatGPT)
8. **`get_checkout_status`** - View cart (shows UI in ChatGPT)

### Payment Methods

**Claude/Cursor (Production):**
- Use `create_payment_link` → Opens Stripe Checkout in browser
- Supports: Cards, Apple Pay, Google Pay, Link by Stripe
- PCI compliant - Stripe handles all payment collection

**ChatGPT (Production - when approved):**
- ChatGPT collects payment automatically via ACP
- Uses `complete_checkout` with SharedPaymentToken
- Same payment methods as Stripe Checkout

**Development/Testing:**
- Use `collect_payment_info` with test tokens (pm_card_visa)
- Simulates ACP flow for local testing

## ChatGPT UI Components

When used in ChatGPT, tools like `add_to_cart` and `get_checkout_status` display an interactive shopping cart widget with:

- Product list with quantities
- Price breakdown
- Total calculation
- Buyer information

The UI is defined in `web/src/cart-widget.ts` and compiled into a standalone bundle that's served via MCP resources.

## Payment Flows

This server supports **two production-ready payment flows**:

### 1. Stripe Checkout (Claude/Cursor)
```
User: I want to buy the MCP ebook. My email is scott@janix.ai.

Claude: [generates payment link]
        Here's your secure checkout: https://checkout.stripe.com/...
        
User: [opens link, pays in browser with card/Apple Pay/Google Pay]

Claude: ✅ Payment confirmed! Order #12345
```

**Benefits:**
- Works immediately (no approval needed)
- Supports Apple Pay, Google Pay, Link
- PCI compliant
- Same UX as production Stripe merchants

### 2. ACP/SharedPaymentToken (ChatGPT)
```
User: I want to buy the MCP ebook.

ChatGPT: [shows checkout UI]
User: [enters payment in ChatGPT]
ChatGPT: ✅ Order confirmed!
```

**Benefits:**
- In-app purchase experience
- ChatGPT handles payment collection
- Uses SharedPaymentToken (ACP spec)
- Same payment methods

**Both flows are production-ready and PCI compliant!**

## Architecture

```
AI Assistant
    ↓
MCP Protocol
    ↓
MCP Server (server/)
    ├─→ Commerce SDK (mcp-acp-checkout)
    │       ↓
    │   Stripe API
    └─→ UI Resources (web/dist/)
            ↓
        ChatGPT renders in iframe
```

## Troubleshooting

### UI Not Showing in ChatGPT

1. Make sure you ran `npm run build:web`
2. Check that `web/dist/cart-widget.js` exists
3. Server logs should show "✅ Loaded cart-widget.js"

### Server Not Starting

1. Check `STRIPE_SECRET_KEY` is in config
2. Key must start with `sk_test_` or `sk_live_`
3. Check logs: `~/Library/Logs/Claude/mcp*.log`

### Build Errors

```bash
# Clean and rebuild
rm -rf server/dist web/dist server/node_modules web/node_modules
npm install
npm run build
```

## Examples

### Test with Claude Desktop

**Product search:**
```
What products do you have?
```

**Full purchase (Stripe Checkout):**
```
I want to buy the MCP Development Basics ebook. My email is scott@janix.ai.
```
Opens Stripe Checkout → Pay with test card → Done!

**Quick test (test tokens):**
```
Buy the MCP Server Template for test@example.com using pm_card_visa.
```
Simulates full ACP flow instantly.

### Test with Cursor

Same commands work! Natural language shopping in your IDE.

### Test with ChatGPT (when approved)

ChatGPT will automatically show the cart UI and handle payment collection.

## Documentation

- `TESTING-GUIDE.md` - All testing methods explained
- `NATURAL-SHOPPING-TEST.md` - Natural conversation testing
- `QUICK-TEST.md` - Quick setup guide
- `../packages/commerce/PAYMENT-FLOWS.md` - Deep dive on both payment flows
- `../packages/commerce/SECURITY.md` - Security considerations

## Using This Example

### Study the Code
1. Look at `server/src/index.ts` - See how the SDK is integrated
2. Look at `server/src/products.ts` - See product configuration
3. Run it locally to test the flow

### Build Your Own
1. `npm install mcp-acp-checkout` in YOUR project
2. Copy the integration pattern from this example
3. Add YOUR products and fulfillment logic
4. Deploy YOUR server

## Related

- **The SDK:** [mcp-acp-checkout](../../packages/mcp-acp-checkout) - What you actually install
- **SDK Docs:** [README](../../packages/mcp-acp-checkout/README.md) - Complete API reference
- **OpenAI Examples:** [Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples) - Official patterns

## Remember

**This demo-shop is just an example!**  
The real product is the SDK (`mcp-acp-checkout`) that you install into YOUR OWN MCP server.

## License

MIT License - see [LICENSE](./LICENSE)

---

**Built following OpenAI Apps SDK patterns** 🎨  
**Universal commerce for all AI agents** 🚀
