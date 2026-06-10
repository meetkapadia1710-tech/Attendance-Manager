export function GridSkeleton({ rows = 20, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table className="border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
      <thead className="sticky top-0 z-20 bg-surface-container-low border-b border-outline-variant">
        <tr>
          <th style={{ minWidth: 72, padding: 10 }}>
            <div className="shimmer h-3 w-8 rounded mx-auto" />
          </th>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} style={{ minWidth: 148, padding: 10 }}>
              <div className="flex flex-col items-center gap-2">
                <div className="shimmer w-8 h-8 rounded-full" />
                <div className="shimmer h-3 w-20 rounded" />
                <div className="shimmer h-2 w-16 rounded" />
              </div>
            </th>
          ))}
          <th style={{ minWidth: 90, padding: 10 }}>
            <div className="shimmer h-3 w-10 rounded mx-auto" />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-b border-outline-variant">
            <td style={{ minWidth: 72, padding: 8, textAlign: 'center' }}>
              <div className="shimmer h-5 w-6 rounded mx-auto mb-1" />
              <div className="shimmer h-2 w-8 rounded mx-auto" />
            </td>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} style={{ minWidth: 148, padding: 10, textAlign: 'center' }}>
                <div className="shimmer h-3 w-24 rounded mx-auto mb-1" />
                <div className="shimmer h-3 w-12 rounded mx-auto" />
              </td>
            ))}
            <td style={{ minWidth: 90, padding: 8, textAlign: 'center' }}>
              <div className="shimmer h-4 w-10 rounded mx-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
