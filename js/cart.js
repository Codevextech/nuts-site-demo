// ============================================================
// cart.js – Shopping Cart (localStorage-based)
// ============================================================
import { db, auth } from './firebase-config.js';
import { doc, getDoc, updateDoc, increment, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from './auth.js';

const CART_KEY = 'ns_cart';

export function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}
export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

export function addToCart(product, weight, qty = 1) {
  if (!auth.currentUser) {
    showToast('Please login or register to add items to cart', 'error');
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1500);
    return false;
  }
  const cart = getCart();
  const idx = cart.findIndex(i => i.productId === product.id && i.weight === weight);
  if (idx > -1) {
    cart[idx].qty += qty;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || '',
      category: product.category || '',
      weight,
      price: product.prices?.[weight] || product.price || 0,
      qty
    });
  }
  saveCart(cart);
  return true;
}

export function removeFromCart(productId, weight) {
  const cart = getCart().filter(i => !(i.productId === productId && i.weight === weight));
  saveCart(cart);
}

export function updateQty(productId, weight, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.productId === productId && i.weight === weight);
  if (idx > -1) {
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    saveCart(cart);
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

export function getCartSubtotal(cart) {
  return (cart || getCart()).reduce((s, i) => s + i.price * i.qty, 0);
}

export function getCartCount(cart) {
  return (cart || getCart()).reduce((s, i) => s + i.qty, 0);
}

export function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge, .bottom-nav-badge[data-cart]');
  const count = getCartCount();
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ── Wishlist (localStorage) ──────────────────────────────────
const WISH_KEY = 'ns_wishlist';
export function getWishlist() {
  return JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
}
export function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx > -1) { list.splice(idx, 1); } else { list.push(productId); }
  localStorage.setItem(WISH_KEY, JSON.stringify(list));
  return idx === -1; // true = added
}
export function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

// ── Coupon validation via Firestore ─────────────────────────
export async function applyCoupon(code) {
  const snap = await getDoc(doc(db, 'coupons', code.toUpperCase()));
  if (!snap.exists()) throw new Error('Invalid coupon code');
  const c = snap.data();
  if (!c.active) throw new Error('Coupon is no longer active');
  if (c.expiry && Timestamp.now().seconds > c.expiry.seconds) throw new Error('Coupon has expired');
  if (c.maxUses && c.usedCount >= c.maxUses) throw new Error('Coupon usage limit reached');
  return { code: code.toUpperCase(), discount: c.discount, type: c.type || 'percent' };
}
