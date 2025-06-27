const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzer87iN1PfL8GMx_jlm0Ix-u3PSbc_7sk3G2m0BKAiprNKG1lMjHKtzo1YB0H-qQKO/exec';
let products = [];

// Status feedback
function showStatus(msg, isSuccess) {
  const status = document.getElementById("statusMessage");
  status.textContent = msg;
  status.className = isSuccess ? "success" : "error";
  status.style.display = "block";
  setTimeout(() => status.style.display = "none", 3000);
}

// Load data dari Google Apps Script
async function loadProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      products = data;
      displayProducts(products);
    } else {
      throw new Error("Format data tidak valid");
    }
  } catch (err) {
    showStatus("Gagal memuat data: " + err.message, false);
  }
}

// Tampilkan produk di tabel
function displayProducts(data) {
  const list = document.getElementById("productList");
  list.innerHTML = "";
  if (data.length === 0) {
    list.innerHTML = `<tr><td colspan="5">Tidak ada data</td></tr>`;
    return;
  }
  data.forEach(p => {
    list.innerHTML += `
      <tr>
        <td>${p.Barcode || p.barcode}</td>
        <td>${p["Nama Produk"] || p.productName}</td>
        <td>${p.Jumlah || p.quantity}</td>
        <td>Rp ${Number(p.Harga || p.price).toLocaleString()}</td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="editProduct('${p.Barcode || p.barcode}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteProduct('${p.Barcode || p.barcode}')">Hapus</button>
        </td>
      </tr>`;
  });
}

// Fungsi pencarian (case-insensitive)
function searchProducts() {
  const term = document.getElementById("search").value.trim().toLowerCase();
  const filtered = products.filter(p => {
    const barcode = (p.Barcode || p.barcode || "").toLowerCase();
    const name = (p["Nama Produk"] || p.productName || "").toLowerCase();
    return barcode.includes(term) || name.includes(term);
  });
  displayProducts(filtered);
}

// Simpan produk
async function saveProduct() {
  const barcode = document.getElementById("barcode").value.trim();
  const productName = document.getElementById("productName").value.trim();
  const quantity = document.getElementById("quantity").value.trim() || "1";
  const price = document.getElementById("price").value.trim();

  if (!barcode || !productName || !price) {
    showStatus("Barcode, Nama Produk, dan Harga harus diisi!", false);
    return;
  }

  const formData = new FormData();
  formData.append("barcode", barcode);
  formData.append("productName", productName);
  formData.append("quantity", quantity);
  formData.append("price", price);

  try {
    document.getElementById("saveBtn").disabled = true;
    document.getElementById("saveSpinner").style.display = "inline-block";

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      showStatus("Produk berhasil disimpan!", true);
      resetForm();
      await loadProducts();
    } else {
      throw new Error(result.error || "Gagal menyimpan");
    }
  } catch (err) {
    showStatus("Error: " + err.message, false);
  } finally {
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("saveSpinner").style.display = "none";
  }
}

// Hapus produk
async function deleteProduct(barcode) {
  if (!confirm("Yakin ingin menghapus?")) return;
  const formData = new FormData();
  formData.append("delete", barcode);
  try {
    const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      showStatus("Produk dihapus!", true);
      await loadProducts();
    } else throw new Error(result.error || "Gagal menghapus");
  } catch (err) {
    showStatus("Error: " + err.message, false);
  }
}

// Isi form saat edit
function editProduct(barcode) {
  const p = products.find(p => (p.Barcode || p.barcode) === barcode);
  if (p) {
    document.getElementById("barcode").value = p.Barcode || p.barcode;
    document.getElementById("productName").value = p["Nama Produk"] || p.productName;
    document.getElementById("quantity").value = p.Jumlah || p.quantity;
    document.getElementById("price").value = p.Harga || p.price;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Reset form
function resetForm() {
  document.getElementById("barcode").value = "";
  document.getElementById("productName").value = "";
  document.getElementById("quantity").value = "1";
  document.getElementById("price").value = "";
}

// ------------------------
// Barcode scanner dengan QuaggaJS
// ------------------------

let scannerRunning = false;

document.getElementById("btn-scan").addEventListener("click", () => {
  const container = document.getElementById("scanner-container");

  if (scannerRunning) {
    Quagga.stop();
    container.style.display = "none";
    scannerRunning = false;
  } else {
    container.style.display = "block";
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#interactive"),
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader"]
      }
    }, err => {
      if (err) {
        console.error(err);
        alert("Tidak bisa membuka kamera");
        return;
      }
      Quagga.start();
      scannerRunning = true;
    });

    Quagga.onDetected(data => {
      const code = data.codeResult.code;
      document.getElementById("barcode").value = code;
      Quagga.stop();
      container.style.display = "none";
      scannerRunning = false;
      showStatus("Barcode berhasil dibaca!", true);
    });
  }
});

// Load saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  document.getElementById("search").addEventListener("input", searchProducts);
  document.getElementById("saveBtn").addEventListener("click", saveProduct);
});
