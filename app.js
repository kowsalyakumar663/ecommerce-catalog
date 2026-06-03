// ── State ──────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
let activeFilter = 'all';
let searchQuery = '';
let sortOrder = 'default';

// ── DOM refs ───────────────────────────────────────────
const grid        = document.getElementById('productGrid');
const cartCount   = document.getElementById('cartCount');
const cartItems   = document.getElementById('cartItems');
const cartTotal   = document.getElementById('cartTotal');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const toast       = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');
const sortSelect  = document.getElementById('sortSelect');

// ── Render Products ────────────────────────────────────
function getFiltered() {
  let list = products.filter(p => {
    const matchCat = activeFilter === 'all' || p.category === activeFilter;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (sortOrder === 'price-asc')  list.sort((a, b) => a.price - b.price);
  if (sortOrder === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (sortOrder === 'name-asc')   list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function renderProducts() {
  const list = getFiltered();
  if (!list.length) {
    grid.innerHTML = '<p class="no-results">No products found.</p>';
    return;
  }
  grid.innerHTML = list.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.06}s" data-id="${p.id}">
      ${p.badge ? `<span class="product-badge badge-${p.badge.toLowerCase().replace(' ','-')}">${p.badge}</span>` : ''}
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy"/>
      </div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-stars">${stars(p.rating)} <span class="review-count">(${p.reviews})</span></div>
        <div class="product-bottom">
          <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
          <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');

  // Add-to-cart listeners
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(parseInt(btn.dataset.id));
    });
  });
}

// ── Cart ───────────────────────────────────────────────
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name} added!`);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); }
}

function saveCart() {
  localStorage.setItem('luxe_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);
  cartCount.textContent = count;
  cartTotal.textContent = `₹${total.toLocaleString('en-IN')}`;

  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }
  cartItems.innerHTML = cart.map(c => `
    <div class="cart-item">
      <img src="${c.image}" class="cart-item-img" alt="${c.name}"/>
      <div class="cart-item-info">
        <p class="cart-item-name">${c.name}</p>
        <p class="cart-item-price">₹${(c.price * c.qty).toLocaleString('en-IN')}</p>
        <div class="cart-qty-controls">
          <button onclick="changeQty(${c.id}, -1)">−</button>
          <span>${c.qty}</span>
          <button onclick="changeQty(${c.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${c.id})">✕</button>
    </div>
  `).join('');
}

// ── Toast ──────────────────────────────────────────────
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Cart sidebar ───────────────────────────────────────
document.getElementById('cartBtn').addEventListener('click', () => {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('show');
});
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('show');
}

// ── Filter nav ─────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    activeFilter = link.dataset.filter;
    renderProducts();
  });
});

// ── Search ─────────────────────────────────────────────
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

// ── Sort ───────────────────────────────────────────────
sortSelect.addEventListener('change', (e) => {
  sortOrder = e.target.value;
  renderProducts();
});

// ── Smooth scroll hero btn ─────────────────────────────
document.querySelector('.hero-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
});

// ── Checkout ───────────────────────────────────────────
document.querySelector('.checkout-btn').addEventListener('click', () => {
  if (!cart.length) { showToast('Cart is empty!'); return; }
  cart = [];
  saveCart();
  updateCartUI();
  closeCart();
  showToast('Order placed! 🎉');
});

// ── Init ───────────────────────────────────────────────
updateCartUI();
renderProducts();
