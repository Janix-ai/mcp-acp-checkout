# Quick Setup Guide

## 🎯 Test Your MCP Server in 5 Minutes

### Step 1: Get Stripe Test Key (2 minutes)

1. Go to: https://dashboard.stripe.com/register
2. Create free account
3. Click **Developers** → **API Keys**
4. Copy your **Secret key** (starts with `sk_test_...`)

### Step 2: Configure Claude Desktop (2 minutes)

1. Open: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add this (or merge with existing config):

   ```json
   {
     "mcpServers": {
       "demo-commerce": {
         "command": "node",
         "args": [
           "/Users/scott/AI/ACPcheckout/demo-server/dist/server.js"
         ],
         "env": {
           "STRIPE_SECRET_KEY": "sk_test_YOUR_KEY_HERE"
         }
       }
     }
   }
   ```

3. **Replace `sk_test_YOUR_KEY_HERE`** with your actual Stripe key

4. Save the file

### Step 3: Restart Claude (1 minute)

1. **Fully quit Claude** (Cmd+Q, not just close window)
2. **Reopen Claude Desktop**
3. Wait for it to fully load

### Step 4: Test It! 🚀

In Claude, try these:

```
What products are available?
```

Claude should list 4 products!

```
Tell me about the MCP Development Basics ebook
```

```
I want to buy the MCP basics ebook
```

```
Also add the starter template
```

```
My email is test@example.com, complete my purchase
```

## 🎉 Success Indicators

✅ Claude lists products  
✅ Claude creates checkout session  
✅ Claude adds items to cart  
✅ Claude calculates totals  
✅ You see purchase logs in terminal

## 🐛 Troubleshooting

### "I don't see any tools"

1. Check Claude config path is correct (absolute path!)
2. Make sure `dist/server.js` exists: `ls demo-server/dist/`
3. Restart Claude **completely** (Cmd+Q)
4. Check logs: `tail -f ~/Library/Logs/Claude/mcp*.log`

### "STRIPE_SECRET_KEY error"

1. Make sure key is in `"env"` section of config
2. Key must start with `sk_test_` or `sk_live_`
3. No extra quotes around the key

### "Server crashes"

Check the MCP logs:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

Look for error messages.

## 📊 What's Happening Behind the Scenes

1. Claude Desktop loads your server on startup
2. Server initializes with 4 products
3. Server exposes 6 MCP tools to Claude
4. When you ask about products, Claude calls `search_products` tool
5. When you add to cart, Claude calls `add_to_cart` tool
6. Commerce SDK handles all the logic!

## 🎓 Understanding the Flow

```
You → Claude → MCP Tools → Commerce SDK → Stripe
                   ↓
              Your Server
                   ↓
           onPurchase callback
                   ↓
        Your fulfillment logic
```

## 💡 Next Steps After Testing

1. **Add your own products** - Edit `server.ts`
2. **Implement fulfillment** - Edit `onPurchase` callback
3. **Test real payments** - Use Stripe test cards
4. **Deploy** - Run on a server for production use

## 📚 More Info

- Full README: `demo-server/README.md`
- SDK Docs: `packages/commerce/README.md`
- TypeScript Guide: `codegen/TYPESCRIPT-GUIDE.md`

---

**Questions? Check the logs or README!**

