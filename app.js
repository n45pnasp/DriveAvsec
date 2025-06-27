const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzer87iN1PfL8GMx_jlm0Ix-u3PSbc_7sk3G2m0BKAiprNKG1lMjHKtzo1YB0H-qQKO/exec';
let products = [];
let debounceTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  document.getElementById("saveBtn").addEventListener("click", saveProduct);
  document.getElementById("btn-scan").addEventListener("click", toggleScanner);
  document.getElementById("search").addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchProducts();
    }, 2000);
  });
});

function showStatus(msg, success = true) {
  const el = document.getElementById("statusMessage");
  el.innerText = msg;
  el.className = success ? "success" : "error";
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0
  }).format(amount);
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
        <td>${formatCurrency(p.Harga || p.price)}</td>
        <td>
          <button class="btn btn-small btn-secondary" onclick="editProduct('${p.Barcode || p.barcode}')">Edit</button>
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
  const quantity = document.getElementById("quantity").value.trim() || "1";
  const price = document.getElementById("price").value.trim();

  if (!barcode || !productName || !price) {
    showStatus("Semua kolom harus diisi!", false);
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
      showStatus("Produk berhasil disimpan");
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

function resetForm() {
  ["barcode", "productName", "price"].forEach(id => document.getElementById(id).value = "");
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
      showStatus("Produk dihapus");
      await loadProducts();
    } else {
      throw new Error(result.error || "Gagal menghapus");
    }
  } catch (err) {
    showStatus("Error: " + err.message, false);
  }
}

// === SCAN BARCODE ===
function toggleScanner() {
  const container = document.getElementById("scanner-container");
  if (container.style.display === "block") {
    Quagga.stop();
    container.style.display = "none";
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
      readers: ["ean_reader", "code_128_reader", "upc_reader"]
    }
  }, function (err) {
    if (err) {
      console.error("Quagga error", err);
      showStatus("Gagal membuka kamera", false);
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected((data) => {
    if (data && data.codeResult && data.codeResult.code) {
      const barcode = data.codeResult.code;
      document.getElementById("barcode").value = barcode;
      Quagga.stop();
      container.style.display = "none";
      showStatus("Barcode berhasil dipindai");
    }
  });
}
