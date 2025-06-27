const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzA8xFUkQKccXmMbpc8KMfUyyloD8zUbo4WIIjkO8-MLMTs-I1wPIqYEupfUkm9oXH/exec';
let products = [];
let cart = [];

// Load data produk dari Google Sheets
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

// Tampilkan daftar produk
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

// Render isi keranjang
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

// Cetak struk PDF
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
  const doc = new jsPDF();

  const logo = await loadImageAsBase64("logo.png"); // Ganti sesuai path logo kamu
  let y = 10;

  if (logo) {
    doc.addImage(logo, 'PNG', 80, y, 80, 20);
    y += 25;
  }

  doc.setFontSize(14);
  doc.text("Toko Belanja Bulanan", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(12);
  doc.text(`Tanggal: ${new Date().toLocaleString()}`, 12, y);
  y += 8;

  doc.autoTable({
    startY: y,
    head: [['Produk', 'Qty', 'Harga', 'Total']],
    body: cart.map(item => [
      item.name,
      item.qty,
      `Rp ${item.price.toLocaleString()}`,
      `Rp ${(item.qty * item.price).toLocaleString()}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 123, 255] },
    styles: { fontSize: 10 }
  });

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  doc.text(`Total: Rp ${total.toLocaleString()}`, 14, doc.lastAutoTable.finalY + 10);

  doc.save("struk-belanja.pdf");
}

// Event listener
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

  const btnCetak = document.getElementById("btn-print-pdf");
  if (btnCetak) {
    btnCetak.addEventListener("click", printReceipt);
  }
});
