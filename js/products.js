// ============================================================
// products.js – Product CRUD & Rendering
// ============================================================
import { db } from './firebase-config.js';
import {
  collection, getDocs, getDoc, doc, query,
  where, orderBy, limit, startAfter
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { addToCart, toggleWishlist, isWishlisted } from './cart.js';
import { showToast } from './auth.js';

// ── Fetch all products with optional filters ────────────────
export async function fetchProducts({ category, maxPrice, search, sortBy, bestseller, limitCount } = {}) {
  let q = collection(db, 'products');
  const constraints = [];
  if (category && category !== 'all') constraints.push(where('category', '==', category));
  if (bestseller) constraints.push(where('bestseller', '==', true));
  
  if (limitCount) constraints.push(limit(limitCount));
  const snap = await getDocs(query(q, ...constraints));
  let products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Client-side sort by createdAt desc
  products.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  // Client-side filter for price & search (Firestore doesn't support full-text)
  if (maxPrice) products = products.filter(p => {
    const minP = Math.min(...Object.values(p.prices || { '250g': p.price || 0 }));
    return minP <= maxPrice;
  });
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p => p.name?.toLowerCase().includes(s) || p.category?.toLowerCase().includes(s));
  }
  if (sortBy === 'price-asc') products.sort((a,b) => getMinPrice(a) - getMinPrice(b));
  if (sortBy === 'price-desc') products.sort((a,b) => getMinPrice(b) - getMinPrice(a));
  if (sortBy === 'rating') products.sort((a,b) => (b.rating||0) - (a.rating||0));
  return products;
}

export function getMinPrice(p) {
  if (p.prices) return Math.min(...Object.values(p.prices));
  return p.price || 0;
}

// ── Fetch single product ────────────────────────────────────
export async function fetchProduct(id) {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Render product cards ─────────────────────────────────────
export function renderProductCards(products, containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="ri-shopping-bag-3-line"></i>
        <h3>No products found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>`;
    return;
  }
  container.innerHTML = products.map(p => productCardHTML(p)).join('');
  // Bind buttons
  container.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const p = products.find(x => x.id === id);
      if (!p) return;
      const weight = Object.keys(p.prices || {})[0] || '250g';
      if (addToCart(p, weight)) {
        showToast(`${p.name} added to cart 🛒`);
      }
    });
  });
  container.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const added = toggleWishlist(id);
      btn.classList.toggle('active', added);
      btn.innerHTML = added ? '<i class="ri-heart-fill"></i>' : '<i class="ri-heart-line"></i>';
      showToast(added ? 'Added to wishlist ❤️' : 'Removed from wishlist', 'info');
    });
  });
  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = card.dataset.id;
      window.location.href = `product-detail.html?id=${id}`;
    });
  });
}

// ── Product card HTML template ───────────────────────────────
export function productCardHTML(p) {
  const minPrice = getMinPrice(p);
  const wishlisted = isWishlisted(p.id);
  const stars = renderStars(p.rating || 0);
  const badge = p.bestSeller ? '<span class="product-badge">Best Seller</span>' : (p.isNew ? '<span class="product-badge new">New</span>' : '');
  return `
    <div class="product-card" data-id="${p.id}" tabindex="0" role="button" aria-label="View ${p.name}">
      <div class="product-card-img">
        <img src="${p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'}" alt="${p.name}" loading="lazy"/>
        ${badge}
        <button class="wishlist-btn ${wishlisted?'active':''}" data-id="${p.id}" aria-label="Wishlist">
          <i class="ri-heart-${wishlisted?'fill':'line'}"></i>
        </button>
      </div>
      <div class="product-card-body">
        <p class="product-category-tag">${p.category || ''}</p>
        <h3 class="product-name" title="${p.name}">${p.name}</h3>
        <div class="product-rating">${stars} <span>(${p.reviewCount || 0})</span></div>
        <div class="product-price">
          <span class="price-current">₹${minPrice.toFixed(0)}</span>
          ${p.originalPrice ? `<span class="price-original">₹${p.originalPrice}</span>` : ''}
          <span class="price-unit">/ 250g</span>
        </div>
        <div class="product-card-footer">
          <button class="add-cart-btn" data-id="${p.id}">
            <i class="ri-shopping-cart-2-line"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>`;
}

export function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += `<i class="ri-star-${i <= Math.round(rating) ? 'fill' : 'line'} star${i > Math.round(rating) ? ' empty' : ''}"></i>`;
  }
  return s;
}

// ── Fetch & render categories ────────────────────────────────
export async function fetchCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
