/* Charan Paduka — site script */

// Highlight active nav link
(function () {
  const path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav a[href]").forEach((a) => {
    const href = a.getAttribute("href").toLowerCase();
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });
})();

/* ---------- Cart (localStorage) ---------- */
const CART_KEY = "cp_cart_v1";
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
function saveCart(c) {
  localStorage.setItem(CART_KEY, JSON.stringify(c));
  updateCartBadge();
  if (typeof renderCart === "function") renderCart();
}
function cartCount() { return loadCart().reduce((n, i) => n + i.qty, 0); }
function cartTotal() { return loadCart().reduce((s, i) => s + i.price * i.qty, 0); }

function updateCartBadge() {
  document.querySelectorAll(".cart-badge").forEach((el) => {
    const n = cartCount();
    el.textContent = n;
    el.classList.toggle("zero", n === 0);
  });
}
function addToCart(id, name, price, img, sizeSel) {
  const size = sizeSel ? sizeSel.value : "—";
  const cart = loadCart();
  const key = id + "|" + size;
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, id, name, price, img, size, qty: 1 });
  saveCart(cart);
  flashAdded(name);
}
function changeQty(key, delta) {
  const cart = loadCart();
  const item = cart.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) return removeItem(key);
  saveCart(cart);
}
function removeItem(key) { saveCart(loadCart().filter((i) => i.key !== key)); }
function clearCart() { saveCart([]); }

function flashAdded(name) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--fg);color:#fff;padding:12px 20px;font-size:14px;z-index:200;opacity:0;transition:opacity .25s;";
    document.body.appendChild(t);
  }
  t.textContent = "Added: " + name;
  t.style.opacity = "1";
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.style.opacity = "0"), 1600);
}

/* ---------- Shop (only runs on order page) ---------- */
const PRODUCTS = [
  { id:"jutti",     name:"Classic Jutti",         price:1200, img:"assets/p-jutti.jpg",     cat:"Men",     desc:"Hand-stitched leather", rating:4.7, reviews:128 },
  { id:"mojari",    name:"Embroidered Mojari",    price:1800, img:"assets/p-mojari.jpg",    cat:"Women",   desc:"Zardozi thread work",   rating:4.9, reviews:212 },
  { id:"kolhapuri", name:"Kolhapuri Chappal",     price:950,  img:"assets/p-kolhapuri.jpg", cat:"Men",     desc:"Buffalo hide sandals",  rating:4.6, reviews:89  },
  { id:"wedding",   name:"Wedding Mojari (Gold)", price:2400, img:"assets/p-wedding.jpg",   cat:"Wedding", desc:"Beadwork & sequins",    rating:5.0, reviews:64  },
  { id:"kids",      name:"Kids Jutti",            price:650,  img:"assets/p-kids.jpg",      cat:"Kids",    desc:"Soft-sole little pair", rating:4.8, reviews:54  },
  { id:"formal",    name:"Black Formal Mojari",   price:1650, img:"assets/p-formal.jpg",    cat:"Men",     desc:"Polished office wear",  rating:4.5, reviews:73  },
];

let activeCategory = "All";
let searchQuery = "";

function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  const q = searchQuery.toLowerCase();
  const items = PRODUCTS.filter((p) => {
    const catOk = activeCategory === "All" || p.cat === activeCategory;
    const qOk = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    return catOk && qOk;
  });
  grid.innerHTML = items.length ? items.map(productCard).join("") :
    `<p class="muted" style="grid-column:1/-1;text-align:center;padding:40px;">No products match your search.</p>`;
}

function productCard(p) {
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
  return `
    <article class="shop-card">
      <img src="${p.img}" alt="${p.name}" loading="lazy" width="768" height="768" />
      <div class="shop-card-body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="stars">${stars} <span class="muted" style="color:var(--muted);font-size:12px;">(${p.reviews})</span></div>
        <div class="price">₹${p.price.toLocaleString("en-IN")}</div>
        <div class="add-row">
          <select id="size-${p.id}" aria-label="Size">
            <option value="">Size</option>
            ${[5,6,7,8,9,10,11].map(s => `<option value="${s}">UK ${s}</option>`).join("")}
          </select>
          <button class="btn" onclick="addToCart('${p.id}', ${JSON.stringify(p.name)}, ${p.price}, '${p.img}', document.getElementById('size-${p.id}'))">Add to cart</button>
        </div>
      </div>
    </article>`;
}

function renderCart() {
  const list = document.getElementById("cart-items");
  const sub = document.getElementById("cart-subtotal");
  const ship = document.getElementById("cart-ship");
  const tot = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!list) return;
  const cart = loadCart();
  if (!cart.length) {
    list.innerHTML = `<div class="cart-empty">Your cart is empty.<br/>Add some pairs to get started.</div>`;
  } else {
    list.innerHTML = cart.map(i => `
      <div class="cart-item">
        <img src="${i.img}" alt="${i.name}" />
        <div>
          <div class="name">${i.name}</div>
          <div class="meta">Size: ${i.size}</div>
          <div class="qty-ctrl">
            <button onclick="changeQty('${i.key}', -1)" aria-label="Decrease">−</button>
            <span>${i.qty}</span>
            <button onclick="changeQty('${i.key}', 1)" aria-label="Increase">+</button>
          </div>
          <button class="remove" onclick="removeItem('${i.key}')">Remove</button>
        </div>
        <div class="line-price">₹${(i.price * i.qty).toLocaleString("en-IN")}</div>
      </div>
    `).join("");
  }
  const subtotal = cartTotal();
  const shipping = subtotal === 0 ? 0 : (subtotal >= 2000 ? 0 : 99);
  if (sub) sub.textContent = "₹" + subtotal.toLocaleString("en-IN");
  if (ship) ship.textContent = subtotal === 0 ? "—" : (shipping === 0 ? "FREE" : "₹" + shipping);
  if (tot) tot.textContent = "₹" + (subtotal + shipping).toLocaleString("en-IN");
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

function setCategory(cat, el) {
  activeCategory = cat;
  document.querySelectorAll(".filters li").forEach(li => li.classList.remove("active"));
  if (el) el.classList.add("active");
  renderProducts();
}
function onSearch(e) {
  e.preventDefault();
  searchQuery = document.getElementById("shop-search").value.trim();
  renderProducts();
}

/* ---------- Checkout (mailto) ---------- */
function openCheckout() {
  const cart = loadCart();
  if (!cart.length) return;
  const subtotal = cartTotal();
  const shipping = subtotal >= 2000 ? 0 : 99;
  const lines = cart.map(i => `• ${i.name} (Size ${i.size}) × ${i.qty} = ₹${(i.price * i.qty).toLocaleString("en-IN")}`).join("\n");
  document.getElementById("checkout-summary").innerHTML = cart.map(i => `
    <div class="row-line"><span>${i.name} × ${i.qty}</span><span>₹${(i.price*i.qty).toLocaleString("en-IN")}</span></div>
  `).join("") +
    `<div class="row-line" style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Subtotal</span><span>₹${subtotal.toLocaleString("en-IN")}</span></div>` +
    `<div class="row-line"><span>Shipping</span><span>${shipping === 0 ? "FREE" : "₹" + shipping}</span></div>` +
    `<div class="row-line" style="font-weight:700;color:var(--primary);"><span>Total</span><span>₹${(subtotal+shipping).toLocaleString("en-IN")}</span></div>`;
  document.getElementById("checkout-modal").classList.add("open");
  window._cartLines = lines;
  window._cartTotals = { subtotal, shipping, total: subtotal + shipping };
}
function closeCheckout() { document.getElementById("checkout-modal").classList.remove("open"); }
function placeOrder(e) {
  e.preventDefault();
  const f = e.target;
  const data = Object.fromEntries(new FormData(f).entries());
  const t = window._cartTotals || { subtotal:0, shipping:0, total:0 };
  const subject = `New Order — ${data.name} (₹${t.total.toLocaleString("en-IN")})`;
  const body =
`Hello Charan Paduka,

I'd like to place the following order:

ITEMS
${window._cartLines}

Subtotal: ₹${t.subtotal.toLocaleString("en-IN")}
Shipping: ${t.shipping === 0 ? "FREE" : "₹" + t.shipping}
TOTAL:    ₹${t.total.toLocaleString("en-IN")}

CUSTOMER
Name:  ${data.name}
Phone: ${data.phone}
Email: ${data.email}

DELIVERY ADDRESS
${data.address}

Payment preference: ${data.payment}
Notes: ${data.notes || "—"}

Thank you.`;
  window.location.href = `mailto:hputttar@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return false;
}

/* ---------- Contact form (mailto) ---------- */
function buildContactMailto(e) {
  e.preventDefault();
  const f = e.target;
  const data = Object.fromEntries(new FormData(f).entries());
  const subject = data.subject || `Message from ${data.name}`;
  const body = `Name: ${data.name}\n\n${data.message}`;
  window.location.href = `mailto:hputttar@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return false;
}

/* Init */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderProducts();
  renderCart();
});
