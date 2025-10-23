# Quick Test Guide

## ✅ Server Build Status

Your server is **built and ready**!

```
✅ Server code compiled
✅ Web UI compiled  
✅ Cart widget loaded
✅ 6 tools registered
✅ 4 products available
```

## 🔑 Step 1: Get Stripe Test Key (2 minutes)

1. Go to: https://dashboard.stripe.com/register
2. Create free account (no credit card needed)
3. Click **Developers** in left sidebar
4. Click **API Keys**
5. Copy your **Secret key** (starts with `sk_test_...`)

## 🔧 Step 2: Configure Claude Desktop (1 minute)

Open Claude Desktop config:

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add this (replace `sk_test_YOUR_KEY` with your actual key):

```json
{
  "mcpServers": {
    "commerce": {
      "command": "node",
      "args": [
        "/Users/scott/AI/ACPcheckout/mcp-commerce-server/server/dist/index.js"
      ],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_YOUR_KEY_HERE"
      }
    }
  }
}
```

**⚠️ Important:** If you already have other MCP servers in the config, merge this into the existing `"mcpServers"` object!

## 🔄 Step 3: Restart Claude Desktop

1. **Fully quit** Claude Desktop (Cmd+Q, not just close window)
2. **Reopen** Claude Desktop
3. Wait 5 seconds for it to fully load

## ✨ Step 4: Test It!

In Claude, try these commands:

### Test 1: List Products
```
What products are available?
```

**Expected:** Claude shows 4 products with names and prices

### Test 2: Search
```
Tell me about the MCP basics ebook
```

**Expected:** Claude describes the $29.99 ebook

### Test 3: Add to Cart
```
I want to buy the MCP Development Basics ebook
```

**Expected:** Claude creates a session and adds the item

### Test 4: View Cart
```
What's in my cart?
```

**Expected:** Claude shows your cart with the ebook and total

### Test 5: Add More Items
```
Also add the MCP Server Starter Template
```

**Expected:** Cart updates with both items

### Test 6: Set Buyer Info
```
My email is test@example.com
```

**Expected:** Claude saves your email

### Test 7: Check Out (Test Mode)
```
Complete my purchase
```

**Note:** This will work but won't charge because we're using test mode!

## 🎨 ChatGPT UI (Future)

When you use this in ChatGPT (after it's published), you'll see:
- Interactive shopping cart widget
- Visual product display
- Real-time price updates

For now, Claude shows text responses which works perfectly!

## 🐛 Troubleshooting

### "I don't see the tools in Claude"

1. Check your config file path is correct
2. Make sure you did Cmd+Q to fully quit Claude
3. Check logs:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

### "STRIPE_SECRET_KEY error"

1. Make sure key is in the `"env"` section
2. Key must start with `sk_test_` or `sk_live_`
3. No quotes around the key in the JSON file

### "Tool execution fails"

Check the MCP logs for detailed errors:
```bash
tail -f ~/Library/Logs/Claude/mcp-server-commerce*.log
```

## ✅ Success Indicators

You know it's working when:

- ✅ Claude lists 4 products when asked
- ✅ Claude creates checkout sessions
- ✅ Claude adds items to cart
- ✅ Claude calculates totals correctly
- ✅ You see logs in the MCP log files

## 🎉 What's Next?

After you verify it works:

1. **Customize products** - Edit `server/src/products.ts`
2. **Add fulfillment** - Edit `onPurchase` callback
3. **Get real Stripe key** - For production use
4. **Deploy** - Put it on a server
5. **Publish** - Share with the world!

---

**Need help?** Check the full README or create an issue!

