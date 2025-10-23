/**
 * Basic MCP Server with Commerce
 * 
 * This example shows how to integrate mcp-acp-checkout into an MCP server.
 * 
 * WHAT THIS EXAMPLE DOES:
 * 1. Creates an MCP server using the official SDK
 * 2. Initializes CommerceTools with product catalog
 * 3. Adds commerce tools to the server
 * 4. Starts the server (stdio transport for Claude Desktop/Cursor)
 * 
 * TO RUN THIS EXAMPLE:
 * 1. npm install
 * 2. Set STRIPE_SECRET_KEY environment variable
 * 3. tsx examples/basic-server.ts
 * 
 * TO USE WITH CLAUDE/CURSOR:
 * Add to your claude_desktop_config.json or cursor config:
 * {
 *   "mcpServers": {
 *     "my-commerce-server": {
 *       "command": "node",
 *       "args": ["path/to/basic-server.js"],
 *       "env": {
 *         "STRIPE_SECRET_KEY": "sk_test_..."
 *       }
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { CommerceTools } from '../src/index.js'
import type { Product, Order } from '../src/types/index.js'

// ===========================================================================
// 1. DEFINE YOUR PRODUCT CATALOG
// ===========================================================================

const products: Product[] = [
  {
    id: 'ebook-mcp-guide',
    name: 'Complete MCP Server Development Guide',
    description: 'Learn how to build production-ready MCP servers with TypeScript. Includes examples, best practices, and deployment guides.',
    price: 4900, // $49.00
    currency: 'usd',
    type: 'digital',
    image: 'https://example.com/images/mcp-guide.jpg',
    category: 'Education',
    tags: ['mcp', 'typescript', 'tutorial', 'development']
  },
  {
    id: 'template-ecommerce',
    name: 'MCP E-commerce Template',
    description: 'Ready-to-use MCP server template with commerce integration. Just add your products and deploy.',
    price: 9900, // $99.00
    currency: 'usd',
    type: 'digital',
    image: 'https://example.com/images/template.jpg',
    category: 'Templates',
    tags: ['mcp', 'commerce', 'template', 'starter']
  },
  {
    id: 'consulting-hour',
    name: '1-Hour MCP Consulting Session',
    description: 'Get expert help with your MCP server project. Architecture review, debugging, or implementation guidance.',
    price: 25000, // $250.00
    currency: 'usd',
    type: 'digital',
    category: 'Services',
    tags: ['consulting', 'expert', 'help']
  }
]

// ===========================================================================
// 2. INITIALIZE COMMERCE TOOLS
// ===========================================================================

const commerce = new CommerceTools({
  // Your product catalog
  products,
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET // Optional
  },
  
  // Fulfillment callback - called when purchase completes
  onPurchase: async (order: Order) => {
    console.log('🎉 New purchase!', {
      orderId: order.id,
      buyer: order.buyer.email,
      items: order.items.map(item => item.name),
      total: `$${(order.totals.total / 100).toFixed(2)}`
    })
    
    // TODO: Implement your fulfillment logic here
    // Examples:
    // - Send download link via email
    // - Grant access to digital content
    // - Schedule service delivery
    // - Send webhook to your backend
    
    // For digital products, you might:
    if (order.items.some(item => item.productId.startsWith('ebook-'))) {
      await sendDownloadLink(order.buyer.email, order.id)
    }
    
    // For services:
    if (order.items.some(item => item.productId.startsWith('consulting-'))) {
      await scheduleConsultingSession(order.buyer.email)
    }
  },
  
  // Optional: Session configuration
  session: {
    storage: 'memory', // Use 'redis' for production
    ttl: 3600 // 1 hour
  }
})

// ===========================================================================
// 3. CREATE MCP SERVER
// ===========================================================================

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

// ===========================================================================
// 4. ADD COMMERCE TOOLS TO SERVER
// ===========================================================================

// Get commerce tools from SDK
const commerceTools = commerce.getMCPTools()

// Handle ListTools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: commerceTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  }
})

// Handle CallTool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name
  const args = request.params.arguments || {}
  
  // Find the tool
  const tool = commerceTools.find(t => t.name === toolName)
  
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }
  
  try {
    // Execute the tool
    const result = await tool.execute(args)
    return result
  } catch (error) {
    // Return error as content
    return {
      content: [{
        type: 'text',
        text: `Error: ${(error as Error).message}`
      }],
      isError: true
    }
  }
})

// ===========================================================================
// 5. START SERVER
// ===========================================================================

async function main() {
  // Validate environment
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY environment variable is required')
    process.exit(1)
  }
  
  // Create stdio transport (for Claude Desktop, Cursor, etc.)
  const transport = new StdioServerTransport()
  
  // Connect server to transport
  await server.connect(transport)
  
  console.error('🚀 Commerce MCP Server started!')
  console.error(`📦 Products: ${products.length}`)
  console.error(`🛠️  Tools: ${commerceTools.length}`)
  console.error('💳 Stripe: Connected')
  console.error('Ready to accept AI agent purchases!')
}

// ===========================================================================
// HELPER FUNCTIONS (Implement your own logic)
// ===========================================================================

async function sendDownloadLink(email: string, orderId: string): Promise<void> {
  // TODO: Implement email sending
  // Example with SendGrid, Resend, etc.
  console.log(`📧 Would send download link to ${email} for order ${orderId}`)
  
  // Example:
  // await sendEmail({
  //   to: email,
  //   subject: 'Your Purchase - Download Link',
  //   body: `Thank you for your purchase! Download link: https://...`
  // })
}

async function scheduleConsultingSession(email: string): Promise<void> {
  // TODO: Implement scheduling
  // Example with Calendly API, Cal.com, etc.
  console.log(`📅 Would schedule consulting session for ${email}`)
  
  // Example:
  // await calendly.createBookingLink({
  //   email,
  //   eventType: 'consulting-session'
  // })
}

// ===========================================================================
// RUN IT
// ===========================================================================

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

