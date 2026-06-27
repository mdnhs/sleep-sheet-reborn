type PrintReceiptOptions = {
    orderNumber: string | number;
    createdAt: string;
    userName: string;
    shippingAddress: string;
    currencySymbol?: string;
    items: {
      name: string;
      quantity: number;
      price: number;
    }[];
    subtotal: number;
    shippingCost: number;
    totalAmount: number;
  };

  export function printReceipt({
    orderNumber,
    createdAt,
    userName,
    shippingAddress,
    currencySymbol = "$",
    items,
    subtotal,
    shippingCost,
    totalAmount,
  }: PrintReceiptOptions) {
    const receiptWindow = window.open("", "PRINT", "height=650,width=900,top=100,left=150");

    const receiptContent = `
    <html>
      <head>
        <title>Order Receipt - LUXSTORE</title>
        <style>
          :root {
            --primary: #2c3e50;
            --accent: #e74c3c;
            --text: #333;
          }

          body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            padding: 2rem;
            color: var(--text);
            position: relative;
            overflow: hidden;
            background: #f8f9fa;
          }

          body::after {
            content: "LUXSTORE";
            position: fixed;
            opacity: 0.1;
            font-size: 8rem;
            transform: rotate(-45deg);
            top: 30%;
            left: 10%;
            z-index: -1;
            font-weight: 900;
            color: var(--primary);
          }

          .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 4px solid var(--primary);
          }

          .header h1 {
            font-size: 2.5rem;
            margin: 0;
            color: var(--primary);
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 800;
          }

          .order-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
            padding: 1.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .order-meta p {
            margin: 0.3rem 0;
            font-size: 0.95rem;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 2rem 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          th {
            background: var(--primary);
            color: white;
            padding: 1rem;
            font-weight: 600;
          }

          td {
            padding: 1rem;
            border-bottom: 1px solid #eee;
          }

          tr:last-child td {
            border-bottom: none;
          }

          tr:hover td {
            background: #f8f9fa;
          }

          .totals {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 2rem;
            float: right;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .totals div {
            display: grid;
            grid-template-columns: 120px 150px;
            gap: 1rem;
            margin-bottom: 0.8rem;
          }

          .total-amount {
            color: var(--accent);
            font-weight: 800;
            font-size: 1.2rem;
          }

          .thank-you {
            text-align: center;
            margin-top: 3rem;
            color: var(--primary);
            font-weight: 500;
            opacity: 0.8;
          }

          @media print {
            body {
              padding: 0;
              background: white;
            }
            .order-meta, table, .totals {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LUXSTORE</h1>
          <p>Premium Fashion & Accessories</p>
        </div>

        <div class="order-meta">
          <div>
            <p><strong>Order #</strong></p>
            <p>${orderNumber}</p>
          </div>
          <div>
            <p><strong>Date</strong></p>
            <p>${createdAt}</p>
          </div>
          <div>
            <p><strong>Customer</strong></p>
            <p>${userName}</p>
          </div>
          <div>
            <p><strong>Shipping to</strong></p>
            <p>${shippingAddress}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${currencySymbol}${item.price.toFixed(2)}</td>
                <td>${currencySymbol}${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>${currencySymbol}${subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Shipping:</span>
            <span>${currencySymbol}${shippingCost.toFixed(2)}</span>
          </div>
          <div>
            <span>Total:</span>
            <span class="total-amount">${currencySymbol}${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="thank-you">
          Thank you for shopping with LUXSTORE!<br>
          We value your business ❤️
        </div>
      </body>
    </html>
  `;


    if (receiptWindow) {
      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
      receiptWindow.focus();
      receiptWindow.print();
      receiptWindow.close();
    } else {
      console.error("Unable to open print window. Check popup blocker settings.");
    }
  }
