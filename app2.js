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

  cart.forEach((item, index) => {
    total += item.qty * item.price;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <span>${item.name} × ${item.qty} = Rp ${Number(item.qty * item.price).toLocaleString()}</span>
      <div class="qty-actions">
        <button class="btn btn-small btn-minus" data-index="${index}">−</button>
      </div>
    `;
    list.appendChild(li);
  });

  totalEl.textContent = `Total: Rp ${total.toLocaleString()}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  // Tombol tambah produk ke keranjang
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

  // Tombol kurang dari keranjang
  document.getElementById("cartList").addEventListener("click", e => {
    if (e.target.classList.contains("btn-minus")) {
      const index = parseInt(e.target.dataset.index);
      if (!isNaN(index) && cart[index]) {
        if (cart[index].qty > 1) {
          cart[index].qty--;
        } else {
          cart.splice(index, 1);
        }
        renderCart();
      }
    }
  });

  // Tombol cetak struk
  document.getElementById("btn-print").addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Keranjang kosong, tidak bisa mencetak struk.");
      return;
    }

    let strukWindow = window.open('', '_blank');
    strukWindow.document.write('<html><head><title>Struk Belanja</title>');
    strukWindow.document.write('<style>body{font-family:sans-serif;padding:20px;} h2{margin-bottom:10px;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border:1px solid #ccc;} th{text-align:left;background:#f0f0f0;} .total{text-align:right;margin-top:20px;font-weight:bold;}</style>');
    strukWindow.document.write('</head><body>');
    strukWindow.document.write('<h2>Struk Belanja</h2>');
    strukWindow.document.write('<table>');
    strukWindow.document.write('<tr><th>Produk</th><th>Qty</th><th>Subtotal</th></tr>');

    let total = 0;
    cart.forEach(item => {
      const subtotal = item.qty * item.price;
      total += subtotal;
      strukWindow.document.write(`<tr><td>${item.name}</td><td>${item.qty}</td><td>Rp ${subtotal.toLocaleString()}</td></tr>`);
    });

    strukWindow.document.write('</table>');
    strukWindow.document.write(`<div class="total">Total: Rp ${total.toLocaleString()}</div>`);
    strukWindow.document.write('</body></html>');
    strukWindow.document.close();
    strukWindow.print();
  });
});
