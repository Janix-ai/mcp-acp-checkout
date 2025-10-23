# Natural Shopping Flow Tests

## ✅ What Changed

1. **Sessions auto-create** - Never need to explicitly "start a checkout session"
2. **Full ACP payment flow** - Now includes `collect_payment_info` tool that simulates ChatGPT's payment collection
3. **Complete end-to-end** - Can now test the entire purchase flow in Claude Desktop!

---

## 🎯 Complete Purchase Flow

Here's the **full end-to-end test** that works in Claude:

```
I want to buy the MCP Development Basics ebook. 
My email is scott@janix.ai.
Use card 4242424242424242, expiry 12/2025, CVC 123.
```

**Expected:** Claude will:
1. Search for product ✅
2. Auto-create session ✅  
3. Add to cart ✅
4. Set buyer email ✅
5. Collect payment (create SPT) ✅
6. Complete checkout ✅
7. Return order confirmation! 🎉

---

## 🧪 Test These Natural Phrases

### Test 1: Direct Product Request
```
I want the MCP Development Basics ebook
```

**Expected:**
- ✅ Auto-creates session
- ✅ Adds product to cart
- ✅ Returns sessionId + cart details

---

### Test 2: Multiple Items at Once
```
I'd like the MCP Server Template and the Advanced MCP Course
```

**Expected:**
- ✅ Auto-creates session
- ✅ Adds both products
- ✅ Shows cart total ($148.00)

---

### Test 3: Search Then Buy
```
Show me products about MCP
```
Then:
```
Add the first one to my cart
```

**Expected:**
- First query: Shows products
- Second query: Auto-creates session + adds item

---

### Test 4: Provide Email First
```
My email is scott@example.com, I want to buy the consulting session
```

**Expected:**
- ✅ Auto-creates session
- ✅ Sets buyer info
- ✅ Adds product
- ✅ Returns ready-to-checkout session

---

### Test 5: Complete Multi-Step Flow
```
I want the MCP Development Basics ebook and the starter template. 
My email is test@example.com. 
Show me my cart total.
```

**Expected:**
- ✅ Auto-creates session
- ✅ Adds both items
- ✅ Sets email
- ✅ Shows cart: $78.99

---

## 🎯 Key Improvement

**Before:**
1. User: "I want to start shopping" 😕
2. Claude: Creates session
3. User: "Add X"
4. Claude: Adds to cart

**After:**
1. User: "I want X" 😊
2. Claude: Auto-creates session + adds item (one natural step!)

---

## 🔧 All Available Tools

### Auto-Create Sessions:
- **`search_products`** - Find products by query
- **`add_to_cart`** - Creates session if `sessionId` is omitted
- **`set_buyer_info`** - Creates session if `sessionId` is omitted
- **`create_checkout`** - Still available but rarely needed

### Require Session ID:
- **`get_checkout_status`** - Check cart details
- **`collect_payment_info`** - NEW! Simulates ChatGPT's payment collection
  - Accepts card details (use 4242424242424242 for testing)
  - Creates SharedPaymentToken (SPT)
  - Returns token to use with `complete_checkout`
- **`complete_checkout`** - Process payment with SPT and create order

## 🎉 What Makes This Special

**Same ACP flow works in both ChatGPT AND Claude:**

### In ChatGPT (Production):
1. User shops → ChatGPT collects card
2. ChatGPT creates SPT
3. ChatGPT calls merchant's `complete_checkout` with SPT

### In Claude (Testing):
1. User shops → Claude collects card via `collect_payment_info`
2. SDK creates SPT (simulating ChatGPT)
3. Claude calls `complete_checkout` with SPT

**Result:** Identical ACP-compliant flow, fully testable!

---

## 📝 For Claude Desktop Testing

1. Restart Claude Desktop to load updated tools
2. Try the natural phrases above
3. Claude should handle sessions transparently
4. You only see sessionId in responses (for tracking)

