'use client'

import { useEffect, useState } from 'react'
import { Trophy, Zap, Star } from 'lucide-react'

interface PRCelebrationProps {
  prTypes: string[]
  onClose: () => void
}

export default function PRCelebration({ prTypes, onClose }: PRCelebrationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 100)

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onClose, 500)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => {
        setShow(false)
        setTimeout(onClose, 500)
      }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              width: '10px',
              height: '10px',
              background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5],
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main celebration card */}
      <div
        className={`relative bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-8 shadow-2xl max-w-md mx-4 transform transition-all duration-700 ${
          show ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
        }`}
        style={{
          boxShadow: '0 0 60px rgba(255,215,0,0.6), 0 0 100px rgba(255,165,0,0.4)',
        }}
      >
        {/* Sparkle effects */}
        <div className="absolute -top-4 -left-4 animate-pulse">
          <Star className="w-8 h-8 text-yellow-200 fill-yellow-200" />
        </div>
        <div className="absolute -top-4 -right-4 animate-pulse" style={{ animationDelay: '0.3s' }}>
          <Star className="w-6 h-6 text-yellow-200 fill-yellow-200" />
        </div>
        <div className="absolute -bottom-4 -left-4 animate-pulse" style={{ animationDelay: '0.6s' }}>
          <Star className="w-6 h-6 text-yellow-200 fill-yellow-200" />
        </div>
        <div className="absolute -bottom-4 -right-4 animate-pulse" style={{ animationDelay: '0.2s' }}>
          <Star className="w-8 h-8 text-yellow-200 fill-yellow-200" />
        </div>

        {/* Trophy with glow */}
        <div className="flex justify-center mb-6 relative">
          <div className="absolute inset-0 blur-xl bg-yellow-300 opacity-50 animate-pulse" />
          <Trophy className="w-24 h-24 text-white relative z-10 animate-bounce" style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.8))' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="w-32 h-32 text-yellow-200 opacity-30 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center relative z-10">
          <h2 className="text-5xl font-black text-white mb-3 tracking-wider animate-pulse" style={{ textShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.3)' }}>
            NEW RECORD!
          </h2>
          <div className="text-2xl font-bold text-white mb-4">
            🎉 自己ベスト達成！ 🎉
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/40">
            {prTypes.map((type, idx) => (
              <div key={idx} className="text-white text-lg font-bold mb-1">
                ⚡ {type === 'WEIGHT_PR' ? '重量PR' : type === 'VOLUME_PR' ? '体積PR' : type}
              </div>
            ))}
          </div>
          <p className="text-white/90 text-sm mt-4 font-medium">
            素晴らしい！この調子で頑張ろう💪
          </p>
        </div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-600/50 to-transparent rounded-b-3xl" />
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  )
}
