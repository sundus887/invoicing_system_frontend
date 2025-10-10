const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'PDFInvoice.jsx');
let text = fs.readFileSync(filePath, 'utf8');
let changed = false;

// 1) Ensure QRCode import exists after jsPDF import
if (!text.includes("import QRCode from 'qrcode';")) {
  text = text.replace(/^(import jsPDF from 'jspdf';)(\r?\n)/m, `$1$2$2import QRCode from 'qrcode';$2`);
  changed = true;
}

// 2) Replace temporary QR stub that returns null with real QR generation
const qrStubRegex = /\/\/ For now, return null[\s\S]*?return null;/;
if (qrStubRegex.test(text)) {
  text = text.replace(qrStubRegex, `    // Generate a PNG data URL for the QR code\n    const dataUrl = await QRCode.toDataURL(qrDataString, {\n      errorCorrectionLevel: 'M',\n      width: 256,\n      margin: 1\n    });\n    return dataUrl;`);
  changed = true;
}

// 3a) Remove creation of temporary Image() block
const imageBlockRegex = /\/\/ Create image from QR code data URL\r?\n\s*const qrImage = new Image\(\);\r?\n\s*qrImage\.src = qrCodeDataURL;\r?\n/;
if (imageBlockRegex.test(text)) {
  text = text.replace(imageBlockRegex, '');
  changed = true;
}

// 3b) Replace addImage to use data URL directly
if (text.includes("doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);")) {
  text = text.replace("doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);", "doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);");
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, text);
  console.log('Updated PDFInvoice.jsx with QR code generation and embedding.');
} else {
  console.log('No changes were necessary. File already updated.');
}
