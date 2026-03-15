const PDFDocument = require('pdfkit');


const generateInvoicePDF = (order, items, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

     
      doc
        .fillColor('#444444')
        .fontSize(20)
        .text('INVOICE', 50, 50, { align: 'right' })
        .fontSize(10)
        .text('Textile E-commerce', 50, 50)
        .text('Erode, Tamil Nadu, 638060', 50, 65)
        .text('Email: smtextiles.export@gmail.com', 50, 80)
        .text('Phone: +91 98765 43210', 50, 95)
        .moveDown();

      const addressParams = typeof order.delivery_address === 'string' 
        ? JSON.parse(order.delivery_address) 
        : order.delivery_address || {};

     
      const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN');

     
      doc.fontSize(10).text(`Invoice Number: INV-${order.id}`, 50, 150);
      doc.text(`Order Date: ${orderDate}`, 50, 165);
      doc.text(`Payment Mode: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}`, 50, 180);
      doc.text(`Payment Status: ${order.payment_status}`, 50, 195);
      
     
      doc.text('Billed To:', 300, 150);
      doc.text(user.name || 'Customer', 300, 165);
      doc.text(user.email || '', 300, 180);
      if (user.phone_number) {
        doc.text(user.phone_number, 300, 195);
      }

     
      doc.text('Delivered To:', 50, 230);
      doc.text(addressParams.label || 'Home', 50, 245);
      doc.text(addressParams.street || '', 50, 260);
      doc.text(`${addressParams.city || ''}, ${addressParams.state || ''} ${addressParams.pincode || ''}`, 50, 275);
      doc.text(addressParams.country || 'India', 50, 290);
      
      doc.moveDown(2);

     
      const tableTop = 330;
      doc.font('Helvetica-Bold');
      doc.text('Item Description', 50, tableTop);
      doc.text('Quantity', 300, tableTop, { width: 90, align: 'right' });
      doc.text('Price (INR)', 400, tableTop, { width: 90, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();
      doc.font('Helvetica');

     
      let yPosition = tableTop + 25;
      items.forEach((item) => {
        doc.text(item.name || 'Product', 50, yPosition);
        doc.text(item.quantity.toString(), 300, yPosition, { width: 90, align: 'right' });
        doc.text(`₹${parseFloat(item.price_at_purchase).toFixed(2)}`, 400, yPosition, { width: 90, align: 'right' });
        yPosition += 20;
      });

      doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
      yPosition += 15;

     
      doc.font('Helvetica-Bold');
      doc.text('Total Amount:', 300, yPosition, { width: 90, align: 'right' });
      doc.text(`₹${parseFloat(order.total_amount).toFixed(2)}`, 400, yPosition, { width: 90, align: 'right' });

     
      doc.font('Helvetica')
        .fontSize(10)
        .text('Thank you for shopping with us!', 50, yPosition + 50, { align: 'center', width: 450 });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
