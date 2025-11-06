export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="mr-3 h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
            <div className="h-5 w-24 bg-gray-200 rounded mb-3"></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
