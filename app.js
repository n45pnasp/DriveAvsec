const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzer87iN1PfL8GMx_jlm0Ix-u3PSbc_7sk3G2m0BKAiprNKG1lMjHKtzo1YB0H-qQKO/exec';
let products = [];
let searchTimeout = null;

// Status Message Helper
function showStatus(msg, isSuccess = true) {
  const status = document.getElementById("statusMessage");
  status.textContent = msg;
  status.className = isSuccess ? "success" : "error";
  status.style.display = "block";
  setTimeout(() => status.style.display = "none", 3000);
}

// Load Produk dari Google Script
async function loadProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    products = Array.isArray(data) ? data : (data.records || []);
    displayProducts(products);
  } catch (err) {
    showStatus("Gagal memuat data: " + err.message, false);
  }
}

// Tampilkan Tabel
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
        <td>Rp ${Number(p.Harga || p.price).toLocaleString("id-ID")}</td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="editProduct('${p.Barcode || p.barcode}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteProduct('${p.Barcode || p.barcode}')">Hapus</button>
        </td>
      </tr>
    `;
  });
}

// Simpan Produk
async function saveProduct() {
  const barcode = document.getElementById("barcode").value.trim();
  const productName = document.getElementById("productName").value.trim();
  const quantity = document.getElementById("quantity").value.trim() || "1";
  const price = document.getElementById("price").value.trim();

  if (!barcode || !productName || !price) {
    showStatus("Barcode, Nama Produk, dan Harga wajib diisi!", false);
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
      showStatus("Produk berhasil disimpan!");
      resetForm();
      await loadProducts();
    } else {
      throw new Error(result.error || "Gagal menyimpan data");
    }
  } catch (err) {
    showStatus("Error: " + err.message, false);
  } finally {
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("saveSpinner").style.display = "none";
  }
}

// Reset Form
function resetForm() {
  document.getElementById("barcode").value = "";
  document.getElementById("productName").value = "";
  document.getElementById("quantity").value = "1";
  document.getElementById("price").value = "";
}

// Edit Produk
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

// Hapus Produk
async function deleteProduct(barcode) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;

  const formData = new FormData();
  formData.append("delete", barcode);

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.success) {
      showStatus("Produk berhasil dihapus!");
      await loadProducts();
    } else {
      throw new Error(result.error || "Gagal menghapus produk");
    }
  } catch (err) {
    showStatus("Error: " + err.message, false);
  }
}

// Fungsi Search (debounce 2 detik)
function setupSearchListener() {
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const term = searchInput.value.trim().toLowerCase();
      const filtered = products.filter(p => {
        const barcode = (p.Barcode || p.barcode || "").toLowerCase();
        const name = (p["Nama Produk"] || p.productName || "").toLowerCase();
        return barcode.includes(term) || name.includes(term);
      });
      displayProducts(filtered);
    }, 2000);
  });
}

// Inisialisasi Scanner (QuaggaJS)
function setupScanner() {
  const scanBtn = document.getElementById("btn-scan");
  const scannerContainer = document.getElementById("scanner-container");
  let isScanning = false;

  scanBtn.addEventListener("click", () => {
    if (isScanning) {
      Quagga.stop();
      scannerContainer.style.display = "none";
      isScanning = false;
    } else {
      scannerContainer.style.display = "block";
      Quagga.init({
        inputStream: {
          type: "LiveStream",
          target: document.querySelector('#interactive'),
          constraints: { facingMode: "environment" }
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader"]
        },
      }, (err) => {
        if (err) {
          showStatus("Gagal menginisialisasi scanner: " + err.message, false);
          return;
        }
        Quagga.start();
        isScanning = true;
      });

      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        document.getElementById("barcode").value = code;
        showStatus("Barcode berhasil dibaca: " + code);
        Quagga.stop();
        scannerContainer.style.display = "none";
        isScanning = false;
      });
    }
  });
}

// Inisialisasi Awal
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  setupSearchListener();
  setupScanner();
  document.getElementById("saveBtn").addEventListener("click", saveProduct);
});
