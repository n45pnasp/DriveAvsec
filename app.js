const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzer87iN1PfL8GMx_jlm0Ix-u3PSbc_7sk3G2m0BKAiprNKG1lMjHKtzo1YB0H-qQKO/exec';
let products = [];
let isScannerActive = false;
let targetInput = "barcode";

function showStatus(msg, isSuccess = true) {
  const el = document.getElementById("statusMessage");
  el.textContent = msg;
  el.className = isSuccess ? "success" : "error";
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 3000);
}

async function loadProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    products = data;
    displayProducts(products);
  } catch (err) {
    showStatus("Gagal memuat data: " + err.message, false);
  }
}

function displayProducts(data) {
  const tbody = document.getElementById("productList");
  tbody.innerHTML = data.length === 0 ? "<tr><td colspan='5'>Tidak ada data</td></tr>" : "";

  data.forEach(p => {
    const row = `
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
    tbody.innerHTML += row;
  });
}

function searchProducts() {
  const term = document.getElementById("search").value.toLowerCase();
  const filtered = products.filter(p =>
    (p.Barcode || p.barcode || "").toLowerCase().includes(term) ||
    (p["Nama Produk"] || p.productName || "").toLowerCase().includes(term)
  );
  displayProducts(filtered);
}

document.getElementById("search").addEventListener("input", searchProducts);

document.getElementById("saveBtn").addEventListener("click", async () => {
  const barcode = document.getElementById("barcode").value.trim();
  const productName = document.getElementById("productName").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const price = document.getElementById("price").value.trim();

  if (!barcode || !productName || !price) {
    showStatus("Semua field wajib diisi!", false);
    return;
  }

  const formData = new FormData();
  formData.append("barcode", barcode);
  formData.append("productName", productName);
  formData.append("quantity", quantity);
  formData.append("price", price);

  try {
    document.getElementById("saveBtn").disabled = true;
    document.getElementById("saveSpinner").style.display = "inline";
    const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      showStatus("Produk berhasil disimpan!");
      resetForm();
      loadProducts();
    } else throw new Error(result.error);
  } catch (err) {
    showStatus("Gagal menyimpan: " + err.message, false);
  } finally {
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("saveSpinner").style.display = "none";
  }
});

function resetForm() {
  ["barcode", "productName", "quantity", "price"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("quantity").value = "1";
}

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

async function deleteProduct(barcode) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  const formData = new FormData();
  formData.append("delete", barcode);
  try {
    const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      showStatus("Produk dihapus!");
      loadProducts();
    } else throw new Error(result.error);
  } catch (err) {
    showStatus("Gagal menghapus: " + err.message, false);
  }
}

// Toggle kamera scanner untuk input tertentu
function toggleScanner(inputId) {
  const container = document.getElementById("scanner-container");
  targetInput = inputId;

  if (isScannerActive) {
    Quagga.stop();
    container.style.display = "none";
    isScannerActive = false;
    return;
  }

  container.style.display = "block";
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector("#interactive"),
      constraints: { facingMode: "environment" }
    },
    decoder: {
      readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader", "code_39_reader"]
    }
  }, err => {
    if (err) {
      showStatus("Kamera gagal dibuka", false);
      console.error(err);
      return;
    }
    Quagga.start();
    isScannerActive = true;
  });

  Quagga.onDetected(result => {
    const code = result.codeResult.code;
    document.getElementById(targetInput).value = code;
    if (targetInput === "search") searchProducts();
    showStatus("Barcode: " + code);
    Quagga.stop();
    container.style.display = "none";
    isScannerActive = false;
  });
}

document.addEventListener("DOMContentLoaded", loadProducts);
