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

  document.getElementById("btn-print-pdf").addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("Keranjang kosong, tidak bisa mencetak.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const logoImg = await loadImageAsBase64('logo.png');

    // HEADER
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, 10, 25, 25);
    }
    doc.setFontSize(16);
    doc.text("TOKO AVSEC MAJU", 45, 15);
    doc.setFontSize(10);
    doc.text("Jl. Terminal Airport No. 99\nJakarta - Indonesia", 45, 21);
    doc.text(`Tanggal: ${new Date().toLocaleString()}`, 45, 30);

    // TABEL
    const rows = cart.map(item => [
      item.name,
      item.qty,
      `Rp ${Number(item.price).toLocaleString()}`,
      `Rp ${(item.qty * item.price).toLocaleString()}`
    ]);
    const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

    doc.autoTable({
      startY: 40,
      head: [["Produk", "Qty", "Harga", "Subtotal"]],
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] }
    });

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Total: Rp ${total.toLocaleString()}`, 145, doc.lastAutoTable.finalY + 10, { align: "right" });

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Terima kasih telah berbelanja di Toko Avsec Maju!", 14, doc.lastAutoTable.finalY + 20);

    doc.save("struk-belanja.pdf");
  });
});

// Fungsi konversi logo ke base64
async function loadImageAsBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Gagal memuat logo:", e);
    return null;
  }
}
