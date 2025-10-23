# Security Guidelines for mcp-acp-checkout

## ⚠️ Important Security Notice

### Production vs. Testing

This SDK includes a `collect_payment_info` tool that is **ONLY for testing** in non-ChatGPT MCP clients (like Claude Desktop or Cursor).

## How Payment Collection Works

### ✅ Production (ChatGPT)
```
User → ChatGPT UI (secure) → ChatGPT creates SPT → Your server receives SPT
```
**Your server NEVER sees raw card data** ✅

### ⚠️ Testing (Claude/Cursor)
```
User → MCP tool → Your server receives card data → Creates SPT
```
**Your server DOES see raw card data** ⚠️

## Testing Options (Ranked by Security)

### Option 1: Use Stripe Test Tokens (RECOMMENDED) ✅

**Safest approach** - No raw card data ever touches your server.

```typescript
// In Claude Desktop, use:
collect_payment_info({
  sessionId: "cs_xxx",
  paymentMethodId: "pm_card_visa"  // Stripe's test token
})
```

**Available test tokens:**
- `pm_card_visa` - Visa card
- `pm_card_mastercard` - Mastercard
- `pm_card_amex` - American Express
- `pm_card_discover` - Discover
- `pm_card_diners` - Diners Club
- `pm_card_jcb` - JCB
- `pm_card_unionpay` - UnionPay

**Advantages:**
- ✅ No PCI compliance concerns
- ✅ No Stripe warnings
- ✅ Same test flow as production
- ✅ Works immediately

### Option 2: Enable Raw Card Data in Stripe Test Mode ⚠️

**Only if you need to test specific card numbers.**

```typescript
// In Claude Desktop, use:
collect_payment_info({
  sessionId: "cs_xxx",
  cardNumber: "4242424242424242",
  expMonth: 12,
  expYear: 2025,
  cvc: "123"
})
```

**Requires Stripe configuration** (see steps below)

**Disadvantages:**
- ⚠️ Requires PCI compliance in production
- ⚠️ Card data flows through MCP protocol
- ⚠️ Stripe will send warning emails
- ⚠️ NOT production-safe

### Option 3: ChatGPT (Production) ✅

**The intended production use case.**

ChatGPT handles card collection in their secure UI. Your server only receives SharedPaymentTokens.

**No configuration needed** - works automatically when SDK is used in ChatGPT.

## Enabling Raw Card Data in Stripe (Option 2)

### Steps to Configure Stripe Test Mode:

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/test/settings/integration
   - Make sure you're in **Test mode** (toggle in top-left)

2. **Navigate to Integration Settings**
   - Click "Settings" (⚙️ icon in left sidebar)
   - Click "Integration" under Settings

3. **Enable Raw Card Data API**
   - Scroll to "Sensitive data" section
   - Find "Allow card numbers in API requests"
   - Click "Enable" or toggle to ON
   - Confirm the security warning

4. **Verify Setting**
   - Setting should show: ✅ **Enabled**
   - Only applies to test mode
   - Production mode will always reject raw cards

### After Enabling:

You can now use raw card numbers in test mode:
```
I want to buy the MCP ebook.
My email is scott@janix.ai.
Use card 4242424242424242, expiry 12/2025, CVC 123.
```

## Production Deployment Checklist

When deploying to production:

- [ ] **Remove** or **disable** `collect_payment_info` tool
- [ ] **Only** expose tools that work with SPTs ChatGPT provides
- [ ] **Never** accept raw card data in production
- [ ] **Use** ChatGPT's payment collection exclusively
- [ ] **Verify** Stripe is in live mode
- [ ] **Test** end-to-end flow in ChatGPT before launch

## Why This Matters

### PCI Compliance
Handling raw card data requires:
- Level 1 PCI DSS certification (most complex)
- Annual security audits ($10,000+)
- Quarterly vulnerability scans
- Penetration testing
- Extensive documentation

**Using SPTs = You avoid ALL of this** ✅

### Security Risks
Raw card data on your server means:
- Potential data breaches
- Legal liability
- Fraud exposure
- Reduced Radar effectiveness (Stripe's fraud detection)

**ChatGPT + SPT = Cards never touch your server** ✅

## Testing Workflow

### Recommended Test Flow:

1. **Local Development** - Use `pm_card_visa` tokens
2. **Integration Testing** - Use `pm_card_*` tokens
3. **Pre-Production** - Test with ChatGPT + real Stripe test mode
4. **Production** - ChatGPT only, live Stripe keys

### When to Enable Raw Card Data:

**Never in production.**

In test mode, only if:
- Testing specific card behaviors (declines, 3DS, etc.)
- Debugging payment flows
- You understand PCI implications
- It's temporary for that specific test

## Questions?

- **Q: Can I use raw cards in production?**
  - A: No. Requires PCI Level 1 compliance. Use ChatGPT's collection.

- **Q: Why does my tool accept raw cards then?**
  - A: For testing in Claude/Cursor where ChatGPT's UI isn't available.

- **Q: Is using pm_card_visa safe?**
  - A: Yes! It's Stripe's recommended testing method. No raw data.

- **Q: What if I need to test declined cards?**
  - A: Use Stripe's test tokens: `pm_card_chargeDeclined`, etc.

## Summary

| Approach | Security | PCI Scope | Recommended |
|----------|----------|-----------|-------------|
| ChatGPT (Production) | ✅ Highest | None | ✅ Yes |
| pm_card_* tokens | ✅ High | None | ✅ Yes |
| Raw cards (enabled) | ⚠️ Low | Full | ⚠️ Test only |

**Golden Rule:** In production, ChatGPT collects cards. Your server only sees SPTs.

