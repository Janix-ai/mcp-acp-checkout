#!/bin/bash

# Test script for MCP Commerce Server
# This tests that the server starts and responds correctly

echo "🧪 Testing MCP Commerce Server..."
echo ""

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set, using dummy key for structure test"
    export STRIPE_SECRET_KEY="sk_test_dummy_key_for_testing"
fi

echo "📦 Checking built files..."
if [ ! -f "server/dist/index.js" ]; then
    echo "❌ server/dist/index.js not found"
    echo "   Run: npm run build"
    exit 1
fi
echo "✅ Server dist exists"

if [ ! -f "web/dist/cart-widget.js" ]; then
    echo "⚠️  web/dist/cart-widget.js not found (ChatGPT UI will be disabled)"
else
    echo "✅ Web dist exists"
fi

echo ""
echo "🚀 Starting server for 5 seconds..."
echo "   (Press Ctrl+C to stop earlier)"
echo ""

# Start server in background and capture PID
timeout 5s node server/dist/index.js 2>&1 &
SERVER_PID=$!

# Wait a bit
sleep 2

# Check if process is still running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅ Server started successfully!"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Get Stripe test key from: https://dashboard.stripe.com/test/apikeys"
    echo "   2. Add to Claude Desktop config:"
    echo ""
    echo '   {
     "mcpServers": {
       "commerce": {
         "command": "node",
         "args": ["'$(pwd)'/server/dist/index.js"],
         "env": {
           "STRIPE_SECRET_KEY": "sk_test_your_key_here"
         }
       }
     }
   }'
    echo ""
    echo "   3. Restart Claude Desktop (Cmd+Q then reopen)"
    echo "   4. Ask: 'What products are available?'"
    
    # Kill the server
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Server failed to start"
    exit 1
fi

