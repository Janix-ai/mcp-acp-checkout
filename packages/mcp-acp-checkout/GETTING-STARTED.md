# Getting Started with mcp-acp-checkout

This guide will walk you through setting up commerce in your MCP server in **under 15 minutes**.

## Prerequisites

- Node.js 18+ installed
- Basic JavaScript/TypeScript knowledge (we'll help you learn!)
- A Stripe account ([sign up free](https://stripe.com))
- An MCP server (or we'll create one together)

## Step 1: Get Your Stripe Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Secret key** (starts with `sk_test_...`)
4. Keep it safe - never commit it to git!

## Step 2: Install Dependencies

```bash
# Create new project (or use existing MCP server)
mkdir my-commerce-server
cd my-commerce-server

# Initialize package.json
npm init -y

# Install dependencies
npm install mcp-acp-checkout
npm install @modelcontextprotocol/sdk
npm install typescript tsx @types/node --save-dev

# Initialize TypeScript
npx tsc --init
```

## Step 3: Create Your Product Catalog

Create `products.ts`:

```typescript
import type { Product } from 'mcp-acp-checkout'

export const products: Product[] = [
  {
    id: 'ebook-basics',
    name: 'MCP Basics Guide',
    description: 'Learn the fundamentals of building MCP servers',
    price: 1999, // $19.99
    currency: 'usd',
    type: 'digital',
    tags: ['tutorial', 'beginner']
  },
  {
    id: 'template-starter',
    name: 'MCP Server Starter Template',
    description: 'Production-ready MCP server template',
    price: 4900, // $49.00
    currency: 'usd',
    type: 'digital',
    tags: ['template', 'code']
  }
]
```

## Step 4: Create Your Server

Create `server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { CommerceTools } from 'mcp-acp-checkout'
import { products } from './products.js'

// Initialize commerce
const commerce = new CommerceTools({
  products,
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!
  },
  onPurchase: async (order) => {
    console.log('🎉 New purchase!')
    console.log('Order ID:', order.id)
    console.log('Buyer:', order.buyer.email)
    console.log('Items:', order.items.map(i => i.name).join(', '))
    console.log('Total:', `$${(order.totals.total / 100).toFixed(2)}`)
    
    // TODO: Implement fulfillment
    // - Send download links
    // - Grant access
    // - Send confirmation email
  }
})

// Create MCP server
const server = new Server(
  {
    name: 'my-commerce-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

// Get commerce tools
const tools = commerce.getMCPTools()

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name)
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`)
  }
  return await tool.execute(request.params.arguments || {})
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('🚀 Commerce server ready!')
}

main().catch(console.error)
```

## Step 5: Create Environment File

Create `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
```

Add to `.gitignore`:

```
.env
node_modules/
dist/
```

## Step 6: Update package.json

```json
{
  "name": "my-commerce-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx server.ts"
  },
  "dependencies": {
    "mcp-acp-checkout": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.0.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

## Step 7: Configure Claude/Cursor

### For Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-store": {
      "command": "node",
      "args": ["/absolute/path/to/your/dist/server.js"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your_key_here"
      }
    }
  }
}
```

### For Cursor

Similar configuration in Cursor's MCP settings.

## Step 8: Build and Test

```bash
# Build
npm run build

# Restart Claude Desktop or Cursor

# Test in Claude/Cursor:
# - "What products are available?"
# - "Add the MCP Basics Guide to my cart"
# - "Complete my purchase"
```

## Step 9: Implement Fulfillment

Update the `onPurchase` callback in `server.ts`:

```typescript
onPurchase: async (order) => {
  // Send email with download link
  await sendEmail({
    to: order.buyer.email,
    subject: 'Your Purchase',
    body: `
      Thank you for your purchase!
      
      Order ID: ${order.id}
      
      Download your products:
      ${order.items.map(item => {
        return `- ${item.name}: https://yoursite.com/download/${item.productId}`
      }).join('\n')}
    `
  })
  
  // Log to database
  await db.orders.create(order)
}
```

## Step 10: Go Live

When ready for production:

1. **Get Stripe live keys**
   - Switch from `sk_test_...` to `sk_live_...`

2. **Set up webhook** (optional but recommended)
   - In Stripe Dashboard: Developers → Webhooks
   - Add endpoint: `https://yourserver.com/webhook`
   - Listen for `payment_intent.succeeded`

3. **Deploy your server**
   - Railway, Fly.io, AWS, etc.
   - Or run locally (for personal use)

4. **Update config**
   - Point to production server
   - Use live Stripe keys

## Next Steps

### Enhance Your Store

- **Add more products** - Expand your catalog
- **Custom fulfillment** - Integrate with your delivery system
- **Email automation** - Use SendGrid, Resend, etc.
- **Analytics** - Track sales and revenue
- **Support** - Set up customer support flow

### Advanced Features

- **Tax calculation** - Add tax logic
- **Shipping** - Calculate shipping costs
- **Discounts** - Implement promo codes
- **Subscriptions** - Recurring payments
- **Webhooks** - Real-time Stripe events

## Troubleshooting

### "Session not found"
- Sessions expire after 1 hour
- Create a new checkout session

### "Stripe key invalid"
- Check your `.env` file
- Ensure key starts with `sk_test_` or `sk_live_`
- No quotes needed in `.env`

### "Tool not found"
- Restart Claude/Cursor after config changes
- Check server is running: `ps aux | grep node`
- Check logs: `~/Library/Logs/Claude/mcp.log`

### "Payment failed"
- Use Stripe test cards: `4242 4242 4242 4242`
- Check Stripe Dashboard for error details
- Ensure amount > $0.50 (Stripe minimum)

## Resources

- **Documentation**: [Full API docs](../README.md)
- **TypeScript Guide**: [Learn TypeScript](../../codegen/TYPESCRIPT-GUIDE.md)
- **Examples**: [See examples/](../examples/)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **MCP Docs**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## Support

Need help?
- 🐛 [Report bugs](https://github.com/Janix-ai/mcp-acp-checkout/issues)
- 💬 [Ask questions](https://github.com/Janix-ai/mcp-acp-checkout/discussions)
- 📧 [Email support](mailto:scott@janix.ai)

---

**You're all set! Happy selling! 🚀**

