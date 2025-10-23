/**
 * Product Catalog Configuration
 * 
 * Define your products here. This is what AI agents can browse and purchase.
 */

// @ts-ignore - local development uses relative path, published version uses: import type { Product } from 'mcp-acp-checkout'
import type { Product } from '../../../packages/mcp-acp-checkout/dist/types/index.js'

export const products: Product[] = [
  {
    id: 'ebook-mcp-basics',
    name: 'MCP Development Basics',
    description: 'Learn how to build MCP servers from scratch. Includes TypeScript examples, best practices, and deployment guides. Perfect for developers new to MCP.',
    price: 2999, // $29.99
    currency: 'usd',
    type: 'digital',
    image: 'https://example.com/ebook-mcp-basics.jpg',
    category: 'Education',
    tags: ['mcp', 'tutorial', 'beginner', 'typescript']
  },
  {
    id: 'template-mcp-starter',
    name: 'MCP Server Starter Template',
    description: 'Production-ready MCP server template with authentication, logging, error handling, and testing setup. Just add your tools and deploy!',
    price: 4900, // $49.00
    currency: 'usd',
    type: 'digital',
    category: 'Templates',
    tags: ['mcp', 'template', 'starter', 'production']
  },
  {
    id: 'course-advanced-mcp',
    name: 'Advanced MCP Development Course',
    description: 'Master advanced MCP concepts: custom transports, resource providers, prompt engineering, and scalable architecture. Includes video lessons and code examples.',
    price: 9900, // $99.00
    currency: 'usd',
    type: 'digital',
    category: 'Education',
    tags: ['mcp', 'advanced', 'course', 'video']
  },
  {
    id: 'consulting-1hr',
    name: '1-Hour MCP Consulting Session',
    description: 'Get expert help with your MCP project. Architecture review, debugging assistance, or implementation guidance. Book a video call with an MCP expert.',
    price: 15000, // $150.00
    currency: 'usd',
    type: 'digital',
    category: 'Services',
    tags: ['consulting', 'expert', 'help']
  }
]

