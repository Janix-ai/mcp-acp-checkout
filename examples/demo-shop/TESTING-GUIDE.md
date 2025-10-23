# Testing Guide - Payment Collection

## Three Ways to Test Payments

### Method 1: Stripe Checkout (RECOMMENDED for Real Testing) ✅✅✅

**Most realistic. Works like production. Supports all payment methods.**

#### Test Command (Claude Desktop):
```
I want to buy the MCP Development Basics ebook.
My email is scott@janix.ai.
```

Claude will:
1. Search for product
2. Add to cart (auto-create session)
3. Set buyer email
4. **Generate Stripe Checkout URL**
5. You open URL in browser
6. Complete payment with test card
7. Redirected to success page

#### What You'll See:
```
Payment link created! https://checkout.stripe.com/c/pay/cs_test_...

This link supports:
• Credit/debit cards
• Apple Pay
• Google Pay
• Link by Stripe

Click to complete your purchase! Link expires in 1 hour.
```

#### Test Cards in Stripe Checkout:
- `4242 4242 4242 4242` - Visa (succeeds)
- `5555 5555 5555 4444` - Mastercard (succeeds)
- `4000 0000 0000 0002` - Card declined

#### Why This Method?
- ✅ Most realistic (same UX as production Claude/Cursor)
- ✅ Tests full browser flow
- ✅ Supports Apple Pay, Google Pay, Link
- ✅ No security warnings
- ✅ No Stripe configuration needed

---

### Method 2: Stripe Test Tokens (RECOMMENDED for Quick Testing) ✅

**No Stripe configuration needed. Works immediately.**

#### Test Command (Claude Desktop):
```
I want to buy the MCP Development Basics ebook.
My email is scott@janix.ai.
Use payment method pm_card_visa.
```

Claude will:
1. Search for product
2. Add to cart (auto-create session)
3. Set buyer email
4. Create SharedPaymentToken using `pm_card_visa`
5. Complete checkout
6. Show order confirmation!

#### Available Test Tokens:

| Token | Card Type | Behavior |
|-------|-----------|----------|
| `pm_card_visa` | Visa | ✅ Succeeds |
| `pm_card_mastercard` | Mastercard | ✅ Succeeds |
| `pm_card_amex` | American Express | ✅ Succeeds |
| `pm_card_discover` | Discover | ✅ Succeeds |
| `pm_card_chargeDeclined` | Generic | ❌ Declines |
| `pm_card_chargeDeclinedInsufficientFunds` | Generic | ❌ Insufficient funds |
| `pm_card_chargeDeclinedFraudulent` | Generic | ❌ Fraudulent |

See full list: https://stripe.com/docs/testing#cards

#### Why This Method?
- ✅ No security warnings
- ✅ No Stripe configuration
- ✅ Same as production flow
- ✅ No PCI concerns

---

### Method 2: Raw Card Numbers ⚠️

**Requires Stripe configuration. Test-only.**

#### Stripe Setup Steps:

1. **Open Stripe Dashboard (Test Mode)**
   - Go to: https://dashboard.stripe.com/test/settings/integration
   - Ensure toggle in top-left shows "Test mode"

2. **Enable Raw Card Data**
   - Settings → Integration
   - Scroll to "Sensitive data" section
   - Find "Allow card numbers in API requests"
   - Click "Enable"
   - Confirm the warning

3. **Verify**
   - Should show: ✅ Enabled

#### Test Command (After Enabling):
```
I want to buy the MCP Development Basics ebook.
My email is scott@janix.ai.
Use card 4242424242424242, expiry 12/2025, CVC 123.
```

#### Test Cards:

| Card Number | Brand | Behavior |
|-------------|-------|----------|
| 4242424242424242 | Visa | ✅ Succeeds |
| 5555555555554444 | Mastercard | ✅ Succeeds |
| 378282246310005 | Amex | ✅ Succeeds |
| 4000000000000002 | Visa | ❌ Declines |
| 4000000000009995 | Visa | ❌ Insufficient funds |

Full list: https://stripe.com/docs/testing#cards

#### Why This Method?
- ⚠️ Only if you need specific card testing
- ⚠️ Generates Stripe warnings
- ⚠️ Requires configuration
- ⚠️ Not recommended for regular testing

---

## Complete Test Flows

### Test 1: Basic Purchase (Recommended)
```
I want the MCP Development Basics ebook.
My email is test@example.com.
Use payment method pm_card_visa.
```

**Expected:** ✅ Order confirmation with order ID

---

### Test 2: Multiple Items
```
Add the MCP Development Basics ebook and the MCP Server Template to my cart.
My email is test@example.com.
Use payment method pm_card_mastercard.
```

**Expected:** ✅ Order with 2 items, total $78.99

---

### Test 3: Declined Card
```
I want the MCP Development Basics ebook.
My email is test@example.com.
Use payment method pm_card_chargeDeclined.
```

**Expected:** ❌ Error message about declined payment

---

### Test 4: Check Cart Before Buying
```
What products are available?

I want the Advanced MCP Development Course.

Show me my cart.

My email is test@example.com.

Use payment method pm_card_visa.
```

**Expected:** 
- Product list
- Item added to cart
- Cart summary with $99.00 total
- Email set
- ✅ Order confirmation

---

## Troubleshooting

### Issue: "Must provide either paymentMethodId or cardDetails"

**Fix:** You need to provide one of:
- `paymentMethodId: "pm_card_visa"` (recommended)
- OR raw card details (if enabled in Stripe)

**Try:**
```
Use payment method pm_card_visa
```

---

### Issue: "Sending credit card numbers directly to the Stripe API is generally unsafe"

**This means:** You're using raw card numbers without enabling the Stripe setting.

**Fix Option 1 (Recommended):** Use test tokens instead:
```
Use payment method pm_card_visa
```

**Fix Option 2:** Enable raw card data in Stripe dashboard (see Method 2 above)

---

### Issue: Server not starting or tools not showing

**Check:**
1. Restart Claude Desktop (Cmd+Q, then reopen)
2. Verify `STRIPE_SECRET_KEY` in config
3. Check server logs: `~/Library/Logs/Claude/mcp*.log`
4. Rebuild: `npm run build` in mcp-commerce-server

---

## Production Readiness

### Before Going Live:

- [ ] Switch to live Stripe keys (`sk_live_...`)
- [ ] Remove raw card testing from documentation
- [ ] Test in ChatGPT (not Claude)
- [ ] Verify ChatGPT collects cards (you only get SPT)
- [ ] Set up production fulfillment logic
- [ ] Configure Stripe webhooks

### In Production:

- ✅ ChatGPT collects cards securely
- ✅ Your server only receives SharedPaymentTokens
- ✅ No raw card data ever touches your server
- ✅ PCI compliance handled by ChatGPT + Stripe

---

## Quick Reference

**Simplest test:**
```
Buy the MCP ebook with pm_card_visa, email test@example.com
```

**Most realistic test:**
```
I want to buy the MCP Development Basics ebook.
My email is scott@janix.ai.
Use payment method pm_card_visa.
```

**Test multiple items:**
```
Add MCP ebook and starter template to cart.
Email: test@example.com.
Use pm_card_mastercard.
```

---

## Need Help?

- **Stripe Test Tokens:** https://stripe.com/docs/testing
- **SDK Security Guide:** See `packages/commerce/SECURITY.md`
- **MCP Documentation:** https://modelcontextprotocol.io

