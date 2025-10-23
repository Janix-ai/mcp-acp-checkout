/**
 * Shopping Cart Widget for ChatGPT
 * 
 * This component renders inside ChatGPT when tools return structured content.
 * It receives data via window.openai.toolOutput
 */

import './cart-widget.css'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  currency: string
}

interface CartData {
  sessionId: string
  items: CartItem[]
  totals: {
    subtotal: number
    tax: number
    shipping: number
    total: number
    currency: string
  }
  buyer?: {
    email?: string
    name?: string
  }
}

// Initialize when DOM is ready
function init() {
  const root = document.getElementById('cart-root')
  if (!root) {
    console.error('Cart root element not found')
    return
  }

  // Get data from ChatGPT
  const data = (window as any).openai?.toolOutput as CartData
  
  if (!data) {
    root.innerHTML = '<div class="error">No cart data available</div>'
    return
  }

  render(root, data)
}

function render(root: HTMLElement, data: CartData) {
  const { items, totals, buyer } = data

  root.innerHTML = `
    <div class="cart-widget">
      <div class="cart-header">
        <h3>🛒 Shopping Cart</h3>
        ${buyer?.email ? `<div class="buyer-info">👤 ${buyer.email}</div>` : ''}
      </div>
      
      ${items.length === 0 ? `
        <div class="empty-cart">
          Your cart is empty
        </div>
      ` : `
        <div class="cart-items">
          ${items.map(item => `
            <div class="cart-item">
              <div class="item-details">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-meta">
                  ${formatCurrency(item.price, item.currency)} × ${item.quantity}
                </div>
              </div>
              <div class="item-total">
                ${formatCurrency(item.price * item.quantity, item.currency)}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="cart-totals">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>${formatCurrency(totals.subtotal, totals.currency)}</span>
          </div>
          ${totals.tax > 0 ? `
            <div class="total-row">
              <span>Tax</span>
              <span>${formatCurrency(totals.tax, totals.currency)}</span>
            </div>
          ` : ''}
          ${totals.shipping > 0 ? `
            <div class="total-row">
              <span>Shipping</span>
              <span>${formatCurrency(totals.shipping, totals.currency)}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>Total</span>
            <span>${formatCurrency(totals.total, totals.currency)}</span>
          </div>
        </div>
      `}
    </div>
  `
}

function formatCurrency(cents: number, currency: string): string {
  const dollars = cents / 100
  const symbols: Record<string, string> = {
    usd: '$',
    eur: '€',
    gbp: '£',
    cad: 'CA$',
    aud: 'A$'
  }
  const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase()
  return `${symbol}${dollars.toFixed(2)}`
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

