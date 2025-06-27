function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Setup CORS headers
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // ========== DELETE PRODUCT ==========
    if (e.parameter.delete) {
      const barcode = e.parameter.delete;
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const barcodeCol = headers.indexOf('Barcode') + 1;

      if (barcodeCol < 1) throw new Error("Kolom 'Barcode' tidak ditemukan");

      let rowIndex = -1;
      if (sheet.getLastRow() > 1) {
        const range = sheet.getRange(2, barcodeCol, sheet.getLastRow() - 1, 1);
        const barcodes = range.getValues().flat();
        rowIndex = barcodes.indexOf(barcode) + 2;
      }

      if (rowIndex > 1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Barcode tidak ditemukan'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ========== SAVE / UPDATE PRODUCT ==========
    if (e.parameter.barcode && e.parameter.productName && e.parameter.price) {
      const barcode = e.parameter.barcode;
      const productName = e.parameter.productName;
      const quantity = e.parameter.quantity || 1;
      const price = e.parameter.price;

      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const barcodeCol = headers.indexOf('Barcode') + 1;

      if (barcodeCol < 1) throw new Error("Kolom 'Barcode' tidak ditemukan");

      let rowIndex = -1;
      if (sheet.getLastRow() > 1) {
        const range = sheet.getRange(2, barcodeCol, sheet.getLastRow() - 1, 1);
        const barcodes = range.getValues().flat();
        rowIndex = barcodes.indexOf(barcode) + 2;
      }

      if (rowIndex > 1) {
        sheet.getRange(rowIndex, headers.indexOf('Nama Produk') + 1).setValue(productName);
        sheet.getRange(rowIndex, headers.indexOf('Jumlah') + 1).setValue(quantity);
        sheet.getRange(rowIndex, headers.indexOf('Harga') + 1).setValue(price);
      } else {
        sheet.appendRow([barcode, productName, quantity, price]);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ========== GET PRODUCT LIST ==========
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const products = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(products))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
