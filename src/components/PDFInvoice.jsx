import jsPDF from 'jspdf';

// Function to generate QR code data URL with specific invoice information
const generateQRCodeDataURL = async (invoice, buyer, seller) => {
  try {
    // Create the data string with the required information
    const qrData = {
      buyerNTN: buyer?.buyerNTN || 'N/A',
      sellerNTN: seller?.sellerNTN || 'N/A',
      invoiceDate: invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A',
      invoiceNumber: invoice.invoiceNumber || invoice._id?.slice(-6) || 'N/A'
    };
    
    // Convert to JSON string
    const qrDataString = JSON.stringify(qrData);
    
    console.log('📱 QR Code Data:', qrData);
    console.log('📱 QR Code String:', qrDataString);
    
    // For now, return null to avoid QR code generation issues
    // The QR code functionality can be added later with proper library setup
    console.log('⚠️ QR Code generation temporarily disabled - will be implemented with proper library');
    return null;
    
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    return null;
  }
};

// Professional PDF generation function with proper alignment and table lines
const generatePDFInvoice = async (invoice, buyer, seller) => {
  try {
    console.log('🚀 Starting professional PDF generation for invoice:', invoice._id);
    console.log('📋 Buyer data:', buyer);
    console.log('🏢 Seller data:', seller);
    console.log('📄 Invoice data:', invoice);
    console.log('📅 Invoice issued date:', invoice.issuedDate);
    console.log('👤 Buyer NTN:', buyer?.buyerNTN);
    console.log('🏢 Seller NTN:', seller?.sellerNTN);
    
    // Generate QR code with specific invoice data
    const qrCodeDataURL = await generateQRCodeDataURL(invoice, buyer, seller);
    
    // Create new PDF document with proper margins
    const doc = new jsPDF();
    
    // Set initial position
    let y = 20;
    
    // ===== SELLER INFORMATION SECTION =====
    // Company Header - Centered and professional
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(seller?.companyName || 'SELLER COMPANY NAME', 105, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(seller?.address || 'Seller Address', 105, y, { align: 'center' });
    y += 6;
    doc.text(`Tel: ${seller?.phone || '+92-51-1234567'}`, 105, y, { align: 'center' });
    y += 12;
    
    // Professional horizontal line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 15;
    
    // ===== INVOICE TITLE =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES TAX INVOICE', 105, y, { align: 'center' });
    y += 20;
    
    // ===== INVOICE DETAILS SECTION =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column - Seller details (aligned properly)
    doc.text(`NTN: ${seller?.sellerNTN || 'N/A'}`, 20, y);
    doc.text(`Invoice No: ${invoice.invoiceNumber || invoice._id?.slice(-6) || 'N/A'}`, 20, y + 8);
    
    // Right column - Date and STRN (aligned properly)
    doc.text(`STRN: ${seller?.sellerSTRN || 'N/A'}`, 120, y);
    doc.text(`Date: ${invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}`, 120, y + 8);
    y += 20;
    
    // ===== BUYER INFORMATION SECTION =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Messers:', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${buyer?.companyName || 'Buyer Company Name'}`, 20, y);
    y += 6;
    doc.text(`${buyer?.address || 'N/A'}`, 20, y);
    y += 12;
    
    // Buyer's Tax Details - Two columns with proper alignment
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column
    doc.text(`Buyers STRN: ${buyer?.buyerSTRN || 'N/A'}`, 20, y);
    doc.text(`Truck No: ${buyer?.truckNo || 'N/A'}`, 20, y + 8);
    
    // Right column
    doc.text(`Buyers NTN: ${buyer?.buyerNTN || 'N/A'}`, 120, y);
    y += 15;
    
    // ===== PRODUCTS/SERVICES TABLE - OPTIMIZED ALIGNMENT =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Table dimensions - OPTIMIZED COLUMN WIDTHS
    const tableY = y;
    const tableStartX = 20;
    const tableEndX = 190;
    const tableWidth = tableEndX - tableStartX;
    
    // OPTIMIZED COLUMN POSITIONS - BETTER FIT FOR LAST COLUMN
    const col1X = tableStartX;      // Product (30px)
    const col2X = tableStartX + 30; // Units/Quantity (22px)
    const col3X = tableStartX + 52; // Unit Price (22px)
    const col4X = tableStartX + 74; // Total Value (22px)
    const col5X = tableStartX + 96; // Sales Tax (22px)
    const col6X = tableStartX + 118; // Extra Tax (22px)
    const col7X = tableStartX + 140; // Final Value (50px) - MORE SPACE
    
    // Get services/products data from invoice (using invoice.items now)
    let services = invoice.items && Array.isArray(invoice.items) ? invoice.items : [];
    if (services.length === 0) {
      // Fallback for old invoice structure or empty items
      services = [{
        product: invoice.product || 'Tax Filing',
        quantity: invoice.units || 1,
        unitPrice: invoice.unitPrice || 0,
        totalValue: invoice.totalValue || 0,
        salesTax: invoice.salesTax || 0,
        extraTax: invoice.extraTax || 0,
        finalValue: invoice.finalValue || 0
      }];
    }
    
    console.log('📋 Services to display:', services);
    
    // Calculate total table height based on number of services
    const numServices = services.length || 1;
    const headerHeight = 8; // Height of header section
    const dataRowHeight = 8; // Height of each data row
    const totalDataHeight = numServices * dataRowHeight;
    const totalTableHeight = headerHeight + totalDataHeight;
    
    // DRAW COMPLETE TABLE BORDER
    doc.rect(tableStartX, tableY - 3, tableWidth, totalTableHeight + 3);
    
    // Header row with background - ONLY THIS FOR HEADER
    doc.setFillColor(240, 240, 240);
    doc.rect(tableStartX, tableY - 3, tableWidth, headerHeight);
    doc.setFillColor(0, 0, 0);
    
    // HEADERS - 2 ROWS ONLY
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    // Row 1 Headers
    doc.text('Product', col1X + 2, tableY);
    doc.text('Units/Qty', col2X + 2, tableY);
    doc.text('Unit Price', col3X + 2, tableY);
    doc.text('Total Value', col4X + 2, tableY);
    doc.text('Sales Tax', col5X + 2, tableY);
    doc.text('Extra Tax', col6X + 2, tableY);
    doc.text('Final Value', col7X + 2, tableY);
    
    // Row 2 Headers (only for longer headers)
    doc.setFontSize(7);
    doc.text('Excluding GST', col3X + 2, tableY + 4);
    doc.text('Excluding GST', col4X + 2, tableY + 4);
    doc.text('GST & Extra Tax', col7X + 2, tableY + 4);
    
    // Draw vertical lines for column separation - FULL HEIGHT
    doc.line(col1X, tableY - 3, col1X, tableY + totalTableHeight);
    doc.line(col2X, tableY - 3, col2X, tableY + totalTableHeight);
    doc.line(col3X, tableY - 3, col3X, tableY + totalTableHeight);
    doc.line(col4X, tableY - 3, col4X, tableY + totalTableHeight);
    doc.line(col5X, tableY - 3, col5X, tableY + totalTableHeight);
    doc.line(col6X, tableY - 3, col6X, tableY + totalTableHeight);
    doc.line(col7X, tableY - 3, col7X, tableY + totalTableHeight);
    
    // SINGLE horizontal line to separate header from data
    doc.line(col1X, tableY + headerHeight - 1, tableEndX, tableY + headerHeight - 1);
    
    // DATA ROW - CLEAR SEPARATION FROM HEADERS
    y = tableY + headerHeight + 2; // Start data row below headers with small gap
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    services.forEach((item, index) => {
      const product = item.product || 'Service';
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const totalValue = item.totalValue || (quantity * unitPrice);
      const salesTax = item.salesTax || (totalValue * 0.18);
      const extraTax = item.extraTax || 0;
      const finalValue = item.finalValue || (totalValue + salesTax + extraTax);
      
      console.log(`📄 Row ${index + 1}:`, { product, quantity, unitPrice, totalValue, salesTax, extraTax, finalValue });
      
      // Professional text display - adjusted for new column widths
      const productText = product.length > 12 ? product.substring(0, 12) + '...' : product;
      
      // DATA ROW - CLEAR SEPARATION FROM HEADERS
      doc.text(productText, col1X + 2, y);
      doc.text(quantity.toString(), col2X + 2, y);
      doc.text(unitPrice.toFixed(2), col3X + 2, y);
      doc.text(totalValue.toFixed(2), col4X + 2, y);
      doc.text(salesTax.toFixed(2), col5X + 2, y);
      doc.text(extraTax > 0 ? extraTax.toFixed(2) : '-', col6X + 2, y);
      
      // Final Value - more space for text
      const finalValueStr = finalValue.toFixed(2);
      const finalValueText = finalValueStr.length > 12 ? finalValueStr.substring(0, 12) : finalValueStr;
      doc.text(finalValueText, col7X + 2, y);
      
      y += 8; // Space between rows
    });
    
    y += 15; // Adjusted spacing after table
    
    // ===== SIGNATURE SECTION =====
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Signature lines with proper spacing
    doc.line(20, y, 80, y);
    doc.line(150, y, 190, y);
    y += 5;
    
    // Labels below lines
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED BY', 20, y);
    doc.text('Authorized Signatory', 150, y);
    
    // ===== QR CODE SECTION (BOTTOM RIGHT) =====
    if (qrCodeDataURL) {
      try {
        console.log('🔄 Adding QR code to PDF (bottom right)...');
        console.log('📄 QR Code Data URL:', qrCodeDataURL.substring(0, 100) + '...');
        
        // Create image from QR code data URL
        const qrImage = new Image();
        qrImage.src = qrCodeDataURL;
        
        // Position QR code at the bottom right
        const qrSize = 45; // Size of QR code
        const qrX = 145; // X position (right side)
        const qrY = 250; // Y position (bottom)
        
        // Add QR code image
        doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Add QR code label below
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('QR Code', qrX + qrSize/2 - 15, qrY + qrSize + 5, { align: 'center' });
        
        // Add verification text
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('Scan to verify', qrX + qrSize/2 - 12, qrY + qrSize + 12, { align: 'center' });
        
        console.log('✅ QR code added successfully at bottom right');
        
      } catch (qrError) {
        console.error('❌ Error adding QR code:', qrError);
        // Continue without QR code if there's an error
      }
    } else {
      console.log('⚠️ No QR code generated');
    }
    
    // Save the PDF with professional filename
    const fileName = `Invoice_${invoice.invoiceNumber || invoice._id?.slice(-6) || 'N/A'}_${buyer?.companyName || 'Client'}.pdf`;
    doc.save(fileName);
    
    console.log('✅ Professional PDF generated successfully:', fileName);
    return true;
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export { generatePDFInvoice };
export default generatePDFInvoice;