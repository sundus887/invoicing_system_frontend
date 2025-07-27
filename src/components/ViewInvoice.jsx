import React from 'react';

const ViewInvoice = () => {
  // You can replace this with real data later
  const invoices = [
    { id: 1, clientName: 'Client A', amount: 1000 },
    { id: 2, clientName: 'Client B', amount: 2500 },
  ];

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>Invoices</h2>
      <table style={{ margin: 'auto', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Client Name</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{invoice.id}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{invoice.clientName}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>${invoice.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewInvoice;


