#!/usr/bin/env node

/**
 * MCP Commerce Server
 * 
 * OpenAI Apps SDK compatible MCP server for commerce.
 * Sells products via Claude Desktop, Cursor, and ChatGPT.
 * 
 * Structure follows OpenAI Apps SDK examples pattern:
 * - server/ - MCP server implementation
 * - web/ - UI components for ChatGPT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Import our commerce SDK
// @ts-ignore - local development uses relative path, published version uses: import { CommerceTools } from 'mcp-acp-checkout'
import { CommerceTools } from '../../../packages/mcp-acp-checkout/dist/index.js'
// @ts-ignore
import type { Order } from '../../../packages/mcp-acp-checkout/dist/types/index.js'

// Import product catalog
import { products } from './products.js'

// Get directory paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const webDistPath = join(__dirname, '../../web/dist')

// Load compiled web assets
let CART_JS = ''
let CART_CSS = ''

try {
  CART_JS = readFileSync(join(webDistPath, 'cart-widget.js'), 'utf8')
  console.error('✅ Loaded cart-widget.js')
} catch (error) {
  console.error('⚠️  cart-widget.js not found - ChatGPT UI will not be available')
  console.error('   Run: npm run build:web')
}

try {
  CART_CSS = readFileSync(join(webDistPath, 'cart-widget.css'), 'utf8')
  console.error('✅ Loaded cart-widget.css')
} catch (error) {
  console.error('⚠️  cart-widget.css not found (optional)')
}

// =============================================================================
// INITIALIZE COMMERCE SDK
// =============================================================================

const commerce = new CommerceTools({
  products,
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  onPurchase: async (order: Order) => {
    console.error('═══════════════════════════════════════')
    console.error('🎉 NEW PURCHASE!')
    console.error('═══════════════════════════════════════')
    console.error(`Order ID: ${order.id}`)
    console.error(`Buyer: ${order.buyer.name} (${order.buyer.email})`)
    console.error(`Total: $${(order.totals.total / 100).toFixed(2)} ${order.totals.currency.toUpperCase()}`)
    console.error('\nItems:')
    order.items.forEach((item: any) => {
      console.error(`  - ${item.name} x${item.quantity} = $${(item.price * item.quantity / 100).toFixed(2)}`)
    })
    console.error('\n💡 TODO: Implement fulfillment logic')
    console.error('═══════════════════════════════════════\n')
    
    // TODO: Add fulfillment logic
    // await sendDownloadLink(order.buyer.email, order.items)
    // await grantAccess(order.buyer.email, order.items)
  },
  
  session: {
    storage: 'memory',
    ttl: 3600
  }
})

// =============================================================================
// CREATE MCP SERVER
// =============================================================================

const server = new Server(
  {
    name: 'mcp-commerce-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

console.error('🚀 MCP Commerce Server starting...')
console.error(`📦 Products: ${products.length}`)

// ============================================================================= 
// REGISTER REQUEST HANDLERS
// =============================================================================

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: commerceTools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  }
})

// =============================================================================
// REGISTER MCP TOOLS
// =============================================================================

// Get base commerce tools
const commerceTools = commerce.getMCPTools()

// Enhance tools with ChatGPT UI metadata (if widget available)
const toolsWithUI = commerceTools.map((tool: any) => {
  // Add UI template to cart-related tools
  const shouldShowUI = [
    'add_to_cart',
    'get_checkout_status',
    'create_checkout'
  ].includes(tool.name)
  
  if (shouldShowUI && CART_JS) {
    return {
      ...tool,
      _meta: {
        ...(tool._meta || {}),
        'openai/outputTemplate': 'ui://widget/cart.html',
        'openai/toolInvocation/invoking': 'Updating cart...',
        'openai/toolInvocation/invoked': 'Cart updated'
      }
    }
  }
  
  return tool
})

// Execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name
  const args = request.params.arguments || {}
  
  console.error(`🔧 Tool called: ${toolName}`)
  
  const tool = toolsWithUI.find((t: any) => t.name === toolName)
  
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }
  
  try {
    const result = await tool.execute(args)
    return result
  } catch (error) {
    console.error(`❌ Tool error: ${(error as Error).message}`)
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${(error as Error).message}`
      }],
      isError: true
    }
  }
})

console.error(`🛠️  Registered ${toolsWithUI.length} tools`)

// =============================================================================
// START SERVER
// =============================================================================

async function main() {
  // Validate environment
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ ERROR: STRIPE_SECRET_KEY environment variable is required')
    process.exit(1)
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ ERROR: Invalid STRIPE_SECRET_KEY format')
    process.exit(1)
  }

  // Determine transport mode
  const useHttp = process.env.MCP_TRANSPORT === 'http' || process.argv.includes('--http')
  const port = parseInt(process.env.PORT || '3000', 10)

  if (useHttp) {
    // HTTP/SSE transport for production (ChatGPT, web deployments)
    console.error('🌐 Starting HTTP server with SSE transport...')
    
    const httpServer = createServer(async (req, res) => {
      if (req.url === '/health') {
        // Health check endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'healthy', products: products.length }))
        return
      }

      if (req.url === '/mcp' && req.method === 'POST') {
        // MCP SSE endpoint
        const transport = new SSEServerTransport('/mcp', res)
        await server.connect(transport)
        
        // Handle request body
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        
        req.on('end', async () => {
          try {
            await transport.handlePostMessage(JSON.parse(body), res)
          } catch (error) {
            console.error('Error handling message:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Internal server error' }))
          }
        })
      } else {
        // Unknown route
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))
      }
    })

    httpServer.listen(port, () => {
      console.error(`✅ HTTP Server ready on port ${port}`)
      console.error(`   Health: http://localhost:${port}/health`)
      console.error(`   MCP: http://localhost:${port}/mcp`)
      console.error('💳 Stripe connected')
      console.error('🤖 Waiting for requests...\n')
    })
  } else {
    // Stdio transport for local development (Claude Desktop, Cursor)
    console.error('💻 Starting stdio transport (Claude Desktop mode)...')
    const transport = new StdioServerTransport()
    
    await server.connect(transport)

    console.error('✅ Server ready!')
    console.error('💳 Stripe connected')
    console.error('🤖 Waiting for requests...\n')
  }
}

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection:', reason)
})

// Run
main().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
