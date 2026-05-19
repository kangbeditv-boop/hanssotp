export function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card flex items-center justify-between">
          <div className="flex-1">
            <div className="skeleton h-5 w-40 mb-2" />
            <div className="skeleton h-4 w-28" />
          </div>
          <div className="flex items-center gap-4">
            <div className="skeleton h-6 w-20" />
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-9 w-9 rounded-lg" />
          </div>
          <div className="skeleton h-8 w-32 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
