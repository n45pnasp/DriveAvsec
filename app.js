
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzA8xFUkQKccXmMbpc8KMfUyyloD8zUbo4WIIjkO8-MLMTs-I1wPIqYEupfUkm9oXH/exec';
let products = [];
let isScannerActive = false;

function showStatus(msg, isSuccess) {
  const el = document.getElementById('statusMessage');
  el.textContent = msg;
  el.className = isSuccess ? 'success' : 'error';
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

async function loadProducts() {
  try {
    const res = await fetch(`${SCRIPT_URL}?t=${Date.now()}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      products = data;
      displayProducts(data);
    }
  } catch (err) {
    showStatus("Gagal memuat data: " + err.message, false);
  }
}

function displayProducts(data) {
  const list = document.getElementById('productList');
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
          <button class="btn btn-small btn-secondary" onclick="editProduct('${encodeURIComponent(p.Barcode || p.barcode)}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteProduct('${p.Barcode || p.barcode}')">Hapus</button>
        </td>
      </tr>`;
  });
}

function searchProducts() {
  const term = document.getElementById("search").value.toLowerCase();
  const filtered = products.filter(p =>
    (p.Barcode || p.barcode || '').toLowerCase().includes(term) ||
    (p["Nama Produk"] || p.productName || '').toLowerCase().includes(term)
  );
  displayProducts(filtered);
}

async function saveProduct() {
  const barcode = document.getElementById("barcode").value.trim();
  const productName = document.getElementById("productName").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const price = document.getElementById("price").value.trim();

  if (!barcode || !productName || !price) {
    showStatus("Semua field harus diisi!", false);
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
      showStatus("Produk berhasil disimpan!", true);
      resetForm();
      await loadProducts();
    } else {
      throw new Error(result.error || "Gagal menyimpan");
    }
  } catch (err) {
    showStatus("Gagal: " + err.message, false);
  } finally {
    document.getElementById("saveBtn").disabled = false;
    document.getElementById("saveSpinner").style.display = "none";
  }
}

function resetForm() {
  document.getElementById("barcode").value = "";
  document.getElementById("barcode").readOnly = false;
  document.getElementById("productName").value = "";
  document.getElementById("quantity").value = "1";
  document.getElementById("price").value = "";
}

function editProduct(barcode) {
  const decoded = decodeURIComponent(barcode.trim());
  const p = products.find(p => String(p.Barcode || p.barcode).trim() === decoded);
  if (p) {
    document.getElementById("barcode").value = p.Barcode || p.barcode;
    document.getElementById("barcode").readOnly = true;
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
      showStatus("Produk dihapus!", true);
      await loadProducts();
    } else throw new Error(result.error);
  } catch (err) {
    showStatus("Error: " + err.message, false);
  }
}

document.getElementById("btn-scan").addEventListener("click", () => {
  const container = document.getElementById("scanner-container");
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
      console.error(err);
      showStatus("Gagal membuka kamera", false);
      return;
    }
    Quagga.start();
    isScannerActive = true;
  });

  Quagga.onDetected(result => {
    const code = result.codeResult.code;
    document.getElementById("barcode").value = code;
    showStatus("Barcode terbaca: " + code, true);
    Quagga.stop();
    container.style.display = "none";
    isScannerActive = false;
  });
});

document.getElementById("saveBtn").addEventListener("click", saveProduct);
document.addEventListener("DOMContentLoaded", loadProducts);
