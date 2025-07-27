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

function displayProducts(filterText = '') {
  const list = document.getElementById("productList");
  list.innerHTML = "";

  const filtered = products.filter(p =>
    p["Nama Produk"]?.toLowerCase().includes(filterText.toLowerCase())
  );

  filtered.forEach(p => {
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
      <div class="cart-left">
        <img class="cart-img" src="https://via.placeholder.com/60" alt="img">
        <div class="cart-info">
          <div class="cart-name">${item.name}</div>
          <div class="cart-price">Rp ${item.price.toLocaleString()}</div>
        </div>
      </div>

      <div class="cart-controls">
        <button class="btn-small btn-minus" data-index="${index}">−</button>
        <span>${item.qty}</span>
        <button class="btn-small btn-plus" data-index="${index}">+</button>
      </div>

      <div class="cart-amount">Rp ${(item.qty * item.price).toLocaleString()}</div>

      <button class="remove-btn" data-index="${index}">×</button>
    `;
    list.appendChild(li);
  });

  totalEl.textContent = `Total: Rp ${total.toLocaleString()}`;
  attachCartEvents();
}

function attachCartEvents() {
  document.querySelectorAll('.btn-plus').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      cart[index].qty++;
      renderCart();
    });
  });

  document.querySelectorAll('.btn-minus').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      if (cart[index].qty > 1) {
        cart[index].qty--;
      } else {
        cart.splice(index, 1);
      }
      renderCart();
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      cart.splice(index, 1);
      renderCart();
    });
  });
}

async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

async function printReceipt() {
  if (cart.length === 0) {
    alert("Keranjang kosong");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 200]
  });

  let y = 5;
  const pageWidth = 58;

  // Logo (jika tersedia)
  const logo = await loadImageAsBase64("logo.png");
  if (logo) {
    const logoWidth = 20;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logo, 'PNG', logoX, y, logoWidth, logoWidth);
    y += logoWidth + 2;
  }

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text("TOKO BELANJA BULANAN", pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFontSize(7);
  doc.text(`Jl. Doho No.13, Banyuwangi`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Telp. 082183869994`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setLineWidth(0.2);
  doc.line(2, y, pageWidth - 2, y);
  y += 2;

  doc.text(`Tanggal: ${new Date().toLocaleString()}`, 2, y);
  y += 4;

  // Gunakan autoTable
  const tableData = cart.map(item => [
    `${item.name} x${item.qty}`,
    `Rp ${(item.qty * item.price).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: y,
    head: [['Item', 'Total']],
    body: tableData,
    styles: {
      fontSize: 7,
      font: 'courier',
      cellPadding: 1
    },
    theme: 'plain',
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right' }
    },
    margin: { left: 2, right: 2 }
  });

  y = doc.autoTable.previous.finalY + 2;
  doc.line(2, y, pageWidth - 2, y);
  y += 4;

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  doc.setFontSize(9);
  doc.text(`Total: Rp ${total.toLocaleString()}`, pageWidth - 2, y, { align: 'right' });

  y += 6;
  doc.setFontSize(7);
  doc.text("Terima kasih telah berbelanja!", pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.text("n45pnasp.com/n/454545", pageWidth / 2, y, { align: 'center' });

  doc.save("struk-belanja.pdf");
  showToast("✅ Struk berhasil diunduh!");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
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

  document.getElementById("searchInput").addEventListener("input", e => {
    displayProducts(e.target.value);
  });

  document.getElementById("btn-print-pdf").addEventListener("click", printReceipt);
});
