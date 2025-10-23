# Tests

Comprehensive test suite for `mcp-acp-checkout`.

## Running Tests

### Quick Test (No Stripe Required)
```bash
npm test
```

This runs all tests. Tests that require Stripe will be skipped automatically if no `STRIPE_SECRET_KEY` is set.

### Full E2E Test (With Stripe)
```bash
# Set your Stripe TEST key
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Run tests
npm test
```

**Note:** Only use Stripe **TEST** keys (starts with `sk_test_`). Never use live keys in tests.

### Run Specific Test File
```bash
npm test -- e2e.test.ts
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

---

## Test Structure

### `e2e.test.ts` - End-to-End Tests
Complete shopping flows testing all SDK functionality:
- Product search
- Cart operations (add, remove, update)
- Buyer information
- Checkout creation
- Payment link generation (Stripe)
- MCP tools integration
- Error handling

**What it tests:**
- ✅ Product search works
- ✅ Cart operations work
- ✅ Sessions are created automatically
- ✅ Buyer info validation works
- ✅ Stripe Checkout links are generated correctly
- ✅ All 10 MCP tools are available
- ✅ Error handling is robust

**Stripe Tests:**
- Tests that require Stripe API calls will be skipped if no `STRIPE_SECRET_KEY` is set
- All Stripe tests use **TEST MODE** only
- No real charges are made

---

## Test Requirements

### Environment Variables

**Optional (for full E2E tests):**
```bash
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

If not set, Stripe-dependent tests will be skipped.

### Stripe Test Keys

Get a test key from:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the **Secret key** (starts with `sk_test_`)
3. Set as environment variable

**Important:** Never use live keys (`sk_live_`) in tests!

---

## Writing Tests

### Test Structure
```typescript
describe('Feature Name', () => {
  let commerce: CommerceTools

  beforeEach(() => {
    commerce = new CommerceTools({
      products: [...],
      stripe: { secretKey: 'sk_test_dummy' },
      onPurchase: async (order) => { /* ... */ }
    })
  })

  it('should do something', async () => {
    // Test code
    expect(result).toBe(expected)
  })
})
```

### Skipping Stripe Tests
```typescript
it('should test Stripe feature', async () => {
  if (process.env.STRIPE_SECRET_KEY === 'sk_test_dummy') {
    console.log('⚠️  Skipping - no STRIPE_SECRET_KEY set')
    return
  }
  
  // Stripe test code...
}, 10000) // Increase timeout for API calls
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

Store `STRIPE_SECRET_KEY` in GitHub repository secrets.

---

## Test Coverage Goals

### Current Coverage
- ✅ Core shopping flow (search, cart, checkout)
- ✅ MCP tools generation and execution
- ✅ Error handling
- ✅ Stripe Checkout integration

### Future Coverage (v1.1.0+)
- [ ] Unit tests for each manager class
- [ ] Session expiration tests
- [ ] Webhook handling tests
- [ ] Concurrent session tests
- [ ] Performance tests

---

## Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- -t "should complete entire flow"
```

### Enable Console Logs
Edit `tests/setup.ts` and comment out console mocks:
```typescript
global.console = {
  ...console,
  // log: jest.fn(),  // Commented = logs appear
}
```

---

## Known Issues

### Stripe Rate Limiting
If tests fail due to Stripe rate limiting:
- Add delays between tests: `await new Promise(r => setTimeout(r, 1000))`
- Use fewer test iterations
- Run tests sequentially: `npm test -- --runInBand`

### Session ID Conflicts
Each test creates new sessions automatically, so conflicts shouldn't occur.

---

## Getting Help

- **SDK Issues:** https://github.com/Janix-ai/mcp-acp-checkout/issues
- **Stripe Docs:** https://stripe.com/docs/testing
- **Jest Docs:** https://jestjs.io/docs/getting-started

---

**Happy Testing! 🧪**

