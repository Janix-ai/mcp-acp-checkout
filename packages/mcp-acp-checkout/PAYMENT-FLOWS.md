# Payment Flows - Universal Commerce Across All AI Agents

## Overview

The SDK supports **two payment flows** to work with ALL AI agents:

1. **ACP Flow** (ChatGPT) - SharedPaymentTokens, full ACP spec
2. **Stripe Checkout** (Claude/Cursor/etc.) - Browser-based payment

## Flow Comparison

| Aspect | ChatGPT (ACP) | Claude/Cursor (Stripe Checkout) |
|--------|--------------|--------------------------------|
| **Payment UI** | ChatGPT's interface | Stripe-hosted page |
| **Payment Methods** | Cards, Apple Pay, Google Pay, Link | Cards, Apple Pay, Google Pay, Link |
| **Card Collection** | ChatGPT | Stripe (PCI compliant) |
| **Your Server Sees** | SharedPaymentToken only | Nothing (webhook confirms) |
| **PCI Scope** | None | None |
| **User Experience** | In-app checkout | Browser redirect |
| **Production Ready** | ✅ Yes | ✅ Yes |

---

## Flow 1: ACP (ChatGPT Production)

### Architecture

```
┌──────────────────────────────────────────┐
│ ChatGPT                                  │
│                                          │
│  1. User shops in conversation           │
│  2. ChatGPT shows checkout UI            │
│  3. User enters payment (secure UI)      │
│  4. ChatGPT creates SharedPaymentToken   │
└──────────────────────────────────────────┘
                    │
                    │ POST /complete_checkout
                    │ { sessionId, sharedPaymentToken }
                    ↓
┌──────────────────────────────────────────┐
│ Your MCP Server                          │
│                                          │
│  5. Receives SPT (not raw card!)         │
│  6. Processes payment via Stripe         │
│  7. Creates order                        │
│  8. Triggers fulfillment                 │
└──────────────────────────────────────────┘
```

### Implementation

**Your server does:**
```typescript
const commerce = new CommerceTools({
  products: [...],
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY },
  onPurchase: async (order) => {
    await fulfillOrder(order)
  }
})

// Expose tools
const tools = commerce.getMCPTools()
// register tools with MCP server...
```

**ChatGPT automatically:**
- Collects payment securely
- Creates SharedPaymentToken
- Calls your `complete_checkout` tool
- Shows order confirmation

**Tools used:**
1. `search_products` - Browse catalog
2. `add_to_cart` - Add items
3. `set_buyer_info` - Set email
4. `complete_checkout` - **ChatGPT provides SPT here**
5. `get_checkout_status` - View cart

### Security

✅ **Your server NEVER sees:**
- Card numbers
- CVCs
- Expiry dates
- Any raw payment data

✅ **You only receive:**
- SharedPaymentToken (spt_xxx)
- Token is single-use
- Token is time-limited
- Token is amount-limited

✅ **PCI Compliance:**
- None required
- ChatGPT + Stripe handle it
- You're out of scope

---

## Flow 2: Stripe Checkout (Claude/Cursor)

### Architecture

```
┌──────────────────────────────────────────┐
│ Claude Desktop / Cursor                  │
│                                          │
│  1. User shops in conversation           │
│  2. User requests to buy                 │
│  3. Claude calls create_payment_link     │
└──────────────────────────────────────────┘
                    │
                    │ create_payment_link tool
                    ↓
┌──────────────────────────────────────────┐
│ Your MCP Server                          │
│                                          │
│  4. Creates Stripe Checkout Session      │
│  5. Returns payment URL                  │
└──────────────────────────────────────────┘
                    │
                    │ Returns URL
                    ↓
┌──────────────────────────────────────────┐
│ User's Browser                           │
│                                          │
│  6. User opens URL                       │
│  7. Enters payment on Stripe's page      │
│  8. Stripe processes payment             │
│  9. Redirects to success page            │
└──────────────────────────────────────────┘
                    │
                    │ Webhook
                    ↓
┌──────────────────────────────────────────┐
│ Your Server (Webhook Handler)            │
│                                          │
│  10. Receives checkout.session.completed │
│  11. Creates order                       │
│  12. Triggers fulfillment                │
└──────────────────────────────────────────┘
```

### Implementation

**In Claude Desktop:**
```
User: I want to buy the MCP Development Basics ebook.
      My email is scott@janix.ai.

Claude: [searches products, adds to cart, sets email]
        [calls create_payment_link]
        
        Here's your secure payment link: https://checkout.stripe.com/...
        
        This link supports:
        • Credit/debit cards
        • Apple Pay
        • Google Pay  
        • Link by Stripe
        
        Click to complete your purchase!
```

**Tools used:**
1. `search_products` - Browse catalog
2. `add_to_cart` - Add items
3. `set_buyer_info` - Set email
4. **`create_payment_link`** - Generate Stripe Checkout URL
5. User pays in browser (not via MCP)

### Webhook Setup

**Required for production:**

```typescript
// In your server:
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const event = commerce.getPaymentManager().verifyWebhook(req.body, sig)
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const commerceSessionId = session.metadata.commerceSessionId
    
    // Fulfill order
    await fulfillOrder(commerceSessionId)
  }
  
  res.json({ received: true })
})
```

### Security

✅ **Your server NEVER sees:**
- Card numbers
- CVCs
- Expiry dates
- Any raw payment data

✅ **Stripe handles:**
- All payment collection
- PCI compliance
- Fraud detection
- 3D Secure (if needed)

✅ **You receive:**
- Webhook notification after payment
- Order details in webhook payload
- No sensitive payment data

✅ **PCI Compliance:**
- None required
- Stripe handles everything
- You're out of scope

---

## Payment Methods Supported

### Both Flows Support:

- ✅ Credit/Debit Cards (Visa, Mastercard, Amex, Discover, etc.)
- ✅ Apple Pay
- ✅ Google Pay
- ✅ Link by Stripe (save payment for next time)

### Coming Soon (per Stripe/OpenAI):
- ACH (bank transfers)
- Cash App Pay
- Additional digital wallets

---

## Which Flow When?

### Use ACP Flow When:
- ✅ User is in ChatGPT
- ✅ You're approved for ChatGPT Instant Checkout
- ✅ You want in-app purchasing experience
- ✅ You have ACP implementation ready

### Use Stripe Checkout When:
- ✅ User is in Claude/Cursor/other MCP client
- ✅ Testing locally
- ✅ You need quick setup (no ACP approval needed)
- ✅ You want Stripe's proven checkout UI

### Both Flows Are:
- ✅ Production-ready
- ✅ PCI compliant
- ✅ Secure
- ✅ Support same payment methods
- ✅ Support Apple Pay, Google Pay, etc.

---

## Testing

### Test ACP Flow (ChatGPT):
Not available publicly yet. Requires OpenAI approval.

### Test Stripe Checkout (Claude/Cursor):
```
I want to buy the MCP Development Basics ebook.
My email is test@example.com.
```

Claude will generate a payment link. Open in browser and use Stripe test cards:
- `4242 4242 4242 4242` - Visa (succeeds)
- `5555 5555 5555 4444` - Mastercard (succeeds)
- `4000 0000 0000 0002` - Card declined

### Test with pm_* Tokens (Development Only):
```
Use payment method pm_card_visa
```

This simulates ACP flow for testing without Stripe Checkout redirect.

---

## Architecture Summary

**Universal SDK = One Codebase, All Agents**

```
                 ┌──────────────┐
                 │  Your SDK    │
                 │  One product │
                 │  catalog     │
                 └──────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ↓                               ↓
┌───────────────┐           ┌───────────────────┐
│   ChatGPT     │           │  Claude/Cursor    │
│   ACP Flow    │           │  Checkout Flow    │
│               │           │                   │
│ SPT → Server  │           │  URL → Browser    │
└───────────────┘           └───────────────────┘
```

**Result:** One SDK works everywhere, both flows are production-ready!

---

## FAQ

**Q: Which flow is "better"?**  
A: They're equal. ACP is in-app, Stripe Checkout is browser. Both secure, both support same payment methods.

**Q: Do I need to implement both?**  
A: SDK includes both automatically. Users get appropriate flow based on their AI agent.

**Q: Is Stripe Checkout less secure than ACP?**  
A: No. Both are equally secure. Both keep card data off your server. Both are PCI compliant.

**Q: Can users use Apple Pay with Claude?**  
A: Yes! Stripe Checkout supports Apple Pay, Google Pay, Link, and all card brands.

**Q: What about refunds?**  
A: Same for both flows - you handle refunds via Stripe API. Your responsibility as merchant of record.

**Q: Do I need webhooks for ACP flow?**  
A: No. ACP flow completes synchronously. Webhooks optional for order status updates to ChatGPT.

**Q: Do I need webhooks for Stripe Checkout?**  
A: Yes. Required to know when payment completed and fulfill order.

---

## Next Steps

1. **For ChatGPT (ACP)**
   - Apply for Instant Checkout approval
   - Implement product feed
   - Test with OpenAI
   - Go live!

2. **For Claude/Cursor (Stripe Checkout)**
   - Already works! No approval needed
   - Set up webhook handler
   - Test locally
   - Deploy!

**The SDK handles both flows automatically. Build once, sell everywhere!** 🚀

