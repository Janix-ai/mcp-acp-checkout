# Claude Desktop Setup for Demo Shop

## Step 1: Get Your Stripe Test Key

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Make sure you're in **Test mode** (toggle in top left)
3. Copy the **Secret key** (starts with `sk_test_`)

## Step 2: Configure Claude Desktop

1. Open Claude Desktop
2. Click **Claude** → **Settings** → **Developer** → **Edit Config**
3. This will open `claude_desktop_config.json`
4. Add this configuration:

```json
{
  "mcpServers": {
    "demo-shop": {
      "command": "node",
      "args": [
        "/Users/scott/AI/mcp-acp-checkout/examples/demo-shop/server/dist/index.js"
      ],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_YOUR_KEY_HERE"
      }
    }
  }
}
```

5. Replace `sk_test_YOUR_KEY_HERE` with your actual Stripe test key
6. Save the file
7. **Quit Claude Desktop completely** (Cmd+Q)
8. Restart Claude Desktop

## Step 3: Verify It Works

Open Claude Desktop and type:

> "What tools do you have available?"

You should see 10 commerce tools listed:
- search_products
- create_checkout  
- add_to_cart
- remove_from_cart
- update_cart_quantity
- set_buyer_info
- get_checkout_status
- create_payment_link
- collect_payment_info
- complete_checkout

## Step 4: Test Shopping Flow

Try this conversation:

1. **You:** "Search for products"
   - Claude should show you the demo products

2. **You:** "Add the MCP ebook to my cart"
   - Cart should be created with 1 item

3. **You:** "Show me my cart"
   - Should display cart contents and total

4. **You:** "My email is test@example.com and my name is Test User"
   - Buyer info should be saved

5. **You:** "Create a payment link"
   - Should get a Stripe Checkout URL

6. **Click the URL** and complete checkout with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

7. **Check the terminal** where you're looking at logs
   - Should see "Order received" callback

## Step 5: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/payments
2. You should see your test payment!

---

## Troubleshooting

### "No tools available"
- Restart Claude Desktop completely (Cmd+Q, then reopen)
- Check the config file path is correct
- Verify Stripe key starts with `sk_test_`

### "Module not found" error
- Make sure you ran `npm install` and `npm run build` in demo-shop/server

### "Invalid API key"
- Double-check you're using the **test** key, not live
- Key should start with `sk_test_`
- No extra spaces in the config file

### Payment fails
- Use test card: `4242 4242 4242 4242`
- Make sure you're in Stripe test mode

---

**You're all set!** 🎉

