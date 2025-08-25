import type { Record } from '@/types/records';
import { format } from 'date-fns';

interface RecordsPrintViewProps {
  records: Record[];
}

export function RecordsPrintView({ records }: RecordsPrintViewProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Records Export</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          {`
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 0.75rem;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f9fafb;
            }
            tr {
              page-break-inside: avoid;
            }
          `}
        </style>
      </head>
      <body className="bg-gray-50 font-sans p-4">
        <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <header className="flex justify-between items-center mb-6 border-b pb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Record Report</h1>
              <p className="text-sm text-gray-500">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition text-sm"
            >
              Print
            </button>
          </header>

          <main>
            <table>
              <thead>
                <tr>
                  <th className="w-12">S. No.</th>
                  <th className="w-1/4">Title</th>
                  <th className="w-1/6">Category</th>
                  <th className="w-1/6">Event Date</th>
                  <th>Description</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id}>
                    <td className="text-center">{index + 1}</td>
                    <td className="font-medium text-gray-900">{record.title}</td>
                    <td>
                      {record.categories?.name && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium text-xs">
                          {record.categories.name}
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600">{format(new Date(record.event_date), 'MMM dd, yyyy')}</td>
                    <td>
                      {record.description && (
                        <div
                          className="prose prose-sm max-w-none text-gray-600"
                          dangerouslySetInnerHTML={{ __html: record.description }}
                        />
                      )}
                    </td>
                    <td className="text-sm text-gray-600 whitespace-pre-wrap">{record.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
        </div>
      </body>
    </html>
  );
}
