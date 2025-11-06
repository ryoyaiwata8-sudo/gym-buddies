export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#0ea5e9]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#0ea5e9] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[#1e293b] font-semibold">読み込み中...</p>
      </div>
    </div>
  )
}
