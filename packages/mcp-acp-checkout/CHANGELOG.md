# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-23

### 🎉 Initial Beta Release

The first public beta of `mcp-acp-checkout` - a universal commerce SDK for AI agents.

### Added

#### Core SDK
- `CommerceTools` class - Main SDK interface for commerce functionality
- `SessionManager` - Automatic session creation and management
- `PaymentManager` - Dual payment flow support (Stripe Checkout + ACP)
- TypeScript support with complete type definitions
- In-memory session storage with 1-hour TTL
- Comprehensive error handling and validation

#### MCP Tools (10 total)
- `search_products` - Search and browse product catalog
- `create_checkout` - Create checkout session (auto-creates if omitted)
- `add_to_cart` - Add items to cart (auto-creates session)
- `remove_from_cart` - Remove items from cart
- `update_cart_quantity` - Update item quantities  
- `set_buyer_info` - Set buyer email, name, address (auto-creates session)
- `get_checkout_status` - View cart and session details
- `create_payment_link` - **Generate Stripe Checkout URL** (recommended for Claude/Cursor)
- `collect_payment_info` - Create test payment tokens for development
- `complete_checkout` - Complete purchase with SharedPaymentToken (ChatGPT/ACP)

#### Payment Flows
- **Stripe Checkout** (Production-ready)
  - Browser-based payment page
  - Supports cards, Apple Pay, Google Pay, Link by Stripe
  - PCI compliant (Stripe handles all card data)
  - Works immediately with Claude Desktop, Cursor, and any MCP client
  
- **ACP/SharedPaymentToken** (ChatGPT-ready)
  - In-app payment collection via ChatGPT
  - SharedPaymentToken (SPT) integration
  - Full ACP protocol compliance
  - Ready for ChatGPT App Store

#### Features
- **Universal compatibility** - Works with Claude Desktop, Cursor, ChatGPT, and any MCP client
- **Auto-session creation** - No explicit session management required
- **Complete cart management** - Add, remove, update quantities
- **Product catalog** - Flexible product definitions with metadata
- **Secure payments** - Stripe integration with dual payment flows
- **Order callbacks** - `onPurchase` hook for fulfillment logic
- **Session expiration** - Automatic cleanup after 1 hour
- **Type-safe** - Full TypeScript support with IntelliSense
- **Developer-friendly** - Simple configuration, clear error messages

#### Documentation
- Comprehensive README with quick start
- GETTING-STARTED guide (15-minute setup)
- PAYMENT-FLOWS explanation (both Stripe Checkout and ACP)
- SECURITY best practices and guidelines
- Complete API reference
- TypeScript types documentation
- Two working examples:
  - `basic-server.ts` - Full MCP server example
  - `minimal-example.ts` - Minimal integration example

#### Testing
- End-to-end testing completed with real Stripe payments
- Test mode support with Stripe test tokens
- Natural language shopping flow validated
- Multi-item cart operations tested
- Both payment flows verified

### Technical Details
- **Node.js:** 18+ required
- **TypeScript:** 5.3+ recommended
- **Dependencies:**
  - `@modelcontextprotocol/sdk` ^1.0.2
  - `stripe` ^17.3.1
- **Package size:** 43 kB (gzipped), 175 kB (unpacked)
- **License:** MIT

### Supported Platforms
- ✅ Claude Desktop (Anthropic)
- ✅ Cursor (Anysphere)
- ✅ ChatGPT (OpenAI) - ACP-compliant, ready for approval
- ✅ Any MCP-compatible AI agent

### Breaking Changes
None - this is the first release.

---

## [Unreleased]

### Planned for v1.0.0 (Stable Release)
- Additional platform testing (Cursor, Goose, Claude.ai)
- Community feedback integration
- Production usage validation
- Performance optimizations

### Planned for v1.1.0
- Redis session storage for production scaling
- Webhook handling helpers for Stripe events
- Tax calculation utilities
- Shipping rate calculation utilities
- Enhanced error messages with recovery suggestions

### Planned for v1.2.0
- Product feed generation (ChatGPT Product Feed Spec)
- Inventory management helpers
- Order status tracking
- Refund support and callbacks

### Planned for v2.0.0
- ChatGPT UI components (optional visual enhancements)
- Multi-currency advanced support
- Subscription products and recurring billing
- Discount codes and promotions
- Advanced analytics integration

---

## Links

- [npm package](https://www.npmjs.com/package/mcp-acp-checkout)
- [GitHub repository](https://github.com/Janix-ai/mcp-acp-checkout)
- [Report issues](https://github.com/Janix-ai/mcp-acp-checkout/issues)
- [View documentation](https://github.com/Janix-ai/mcp-acp-checkout#readme)

---

**Note:** This SDK is production-ready and tested with real Stripe payments. All features marked above are fully functional and documented.
