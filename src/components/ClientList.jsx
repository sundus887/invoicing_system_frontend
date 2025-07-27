// ClientList.jsx
export default function ClientList({ invoices }) {
  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Client Invoices</h2>
      {invoices.length === 0 ? (
        <p className="text-gray-500">No invoices found.</p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice, index) => (
            <li
              key={index}
              className="p-2 border rounded shadow flex justify-between"
            >
              <span>{invoice.name}</span>
              <span>{invoice.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
