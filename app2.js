const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzA8xFUkQKccXmMbpc8KMfUyyloD8zUbo4WIIjkO8-MLMTs-I1wPIqYEupfUkm9oXH/exec';

let allProducts = [];
let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    if (Array.isArray(data)) {
      allProducts = data;
      renderProductList();
    }
  } catch (err) {
    console.error("Gagal memuat data produk:", err);
  }
});

function renderProductList() {
  const container = document.getElementById('productListKasir');
  container.innerHTML = "";

  allProducts.forEach(p => {
    const name = p["Nama Produk"] || p.productName;
    const price = Number(p.Harga || p.price);
    const barcode = p.Barcode || p.barcode;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${name}</strong><br/>
      Rp ${price.toLocaleString()}
    `;

    const btnTambah = document.createElement("button");
    btnTambah.textContent = "Tambah";
    btnTambah.className = "btn btn-primary";
    btnTambah.style.marginLeft = "10px";

    const qtyContainer = document.createElement("span");
    qtyContainer.id = `qtyInput-${barcode}`;
    qtyContainer.style.display = "none";
    qtyContainer.style.marginLeft = "10px";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = 1;
    qtyInput.value = 1;
    qtyInput.className = "qty-input";
    qtyInput.id = `qty-${barcode}`;

    const btnOK = document.createElement("button");
    btnOK.textContent = "OK";
    btnOK.className = "btn btn-sm btn-success";
    btnOK.style.marginLeft = "5px";

    btnTambah.addEventListener("click", () => {
      qtyContainer.style.display = "inline-block";
    });

    btnOK.addEventListener("click", () => {
      addToCart(barcode);
      qtyContainer.style.display = "none";
    });

    qtyContainer.appendChild(qtyInput);
    qtyContainer.appendChild(btnOK);
    li.appendChild(btnTambah);
    li.appendChild(qtyContainer);

    container.appendChild(li);
  });
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
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const totalDisplay = document.getElementById('totalHarga');
  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    const row = document.createElement("div");
    row.innerHTML = `
      ${item.name} x ${item.qty} = Rp ${subtotal.toLocaleString()}
    `;
    container.appendChild(row);
  });

  totalDisplay.textContent = `Rp ${total.toLocaleString()}`;
}
