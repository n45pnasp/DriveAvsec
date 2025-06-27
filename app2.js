const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzA8xFUkQKccXmMbpc8KMfUyyloD8zUbo4WIIjkO8-MLMTs-I1wPIqYEupfUkm9oXH/exec';
let products = [];
let cart = [];

async function loadProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      products = data;
      displayProducts();
    } else {
      alert("Data produk tidak valid");
    }
  } catch (err) {
    alert("Gagal memuat produk: " + err.message);
  }
}

function displayProducts() {
  const list = document.getElementById("productList");
  list.innerHTML = "";

  products.forEach(p => {
    const li = document.createElement("li");
    li.className = "product-item";
    li.innerHTML = `
      <div>
        <strong>${p["Nama Produk"]}</strong><br>
        <small>Rp ${Number(p.Harga || 0).toLocaleString()}</small>
      </div>
      <button class="btn btn-add" 
        data-barcode="${encodeURIComponent(p.Barcode)}"
        data-name="${p["Nama Produk"]}"
        data-price="${p.Harga}">Tambah</button>
    `;
    list.appendChild(li);
  });
}

function renderCart() {
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");

  list.innerHTML = "";

  let total = 0;
  cart.forEach(item => {
    total += item.qty * item.price;
    const li = document.createElement("li");
    li.textContent = `${item.name} × ${item.qty} = Rp ${Number(item.qty * item.price).toLocaleString()}`;
    list.appendChild(li);
  });

  totalEl.textContent = `Total: Rp ${total.toLocaleString()}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  document.getElementById("productList").addEventListener("click", e => {
    if (e.target.classList.contains("btn-add")) {
      const barcode = decodeURIComponent(e.target.dataset.barcode);
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price) || 0;

      const existing = cart.find(item => item.barcode === barcode);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ barcode, name, price, qty: 1 });
      }

      renderCart();
    }
  });
});
