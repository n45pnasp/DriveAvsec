const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzA8xFUkQKccXmMbpc8KMfUyyloD8zUbo4WIIjkO8-MLMTs-I1wPIqYEupfUkm9oXH/exec';
let allProducts = [];
let cart = [];

async function fetchProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    allProducts = data;
    renderProductList();
  } catch (err) {
    alert("Gagal memuat data");
  }
}

function renderProductList() {
  const container = document.getElementById('productListKasir');
  container.innerHTML = "";
  allProducts.forEach(p => {
    const name = p["Nama Produk"] || p.productName;
    const price = Number(p.Harga || p.price);
    const barcode = p.Barcode || p.barcode;
    const itemHTML = `
      <li>
        <strong>${name}</strong><br/>
        Rp ${price.toLocaleString()}
        <button class="btn btn-primary" onclick="showQtyInput('${barcode}')">Tambah</button>
        <span id="qtyInput-${barcode}" style="display:none;">
          <input class="qty-input" type="number" min="1" value="1" id="qty-${barcode}" />
          <button class="btn btn-primary btn-sm" onclick="addToCart('${barcode}')">OK</button>
        </span>
      </li>`;
    container.innerHTML += itemHTML;
  });
}

function showQtyInput(barcode) {
  document.querySelectorAll("span[id^='qtyInput-']").forEach(el => el.style.display = "none");
  document.getElementById(`qtyInput-${barcode}`).style.display = "inline";
}

function addToCart(barcode) {
  const qty = parseInt(document.getElementById(`qty-${barcode}`).value) || 1;
  const p = allProducts.find(p => (p.Barcode || p.barcode) === barcode);
  if (!p) return;

  const name = p["Nama Produk"] || p.productName;
  const price = Number(p.Harga || p.price);

  const existing = cart.find(item => item.barcode === barcode);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ barcode, name, price, qty });
  }

  renderCart();
  document.getElementById(`qtyInput-${barcode}`).style.display = "none";
}

function renderCart() {
  const cartList = document.getElementById('cartList');
  const totalDisplay = document.getElementById('totalPrice');
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((item, i) => {
    const subtotal = item.qty * item.price;
    total += subtotal;
    cartList.innerHTML += `
      <li>${item.name} - ${item.qty} x Rp ${item.price.toLocaleString()} 
      = <strong>Rp ${subtotal.toLocaleString()}</strong>
      <button class="btn btn-danger btn-sm" onclick="removeFromCart(${i})">Hapus</button></li>`;
  });
  totalDisplay.textContent = `Rp ${total.toLocaleString()}`;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

document.addEventListener("DOMContentLoaded", fetchProducts);
