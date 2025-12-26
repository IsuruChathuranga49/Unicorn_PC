import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-white mb-4">
            🦄 Unicorn PC Builder
          </h1>
          <p className="text-xl text-purple-100">
            AI-Powered PC Building Platform
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Intelligent Build Card */}
          <Link href="/intelligent-build">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4 group-hover:text-purple-600 transition-colors">
                Intelligent Build
              </h2>
              <p className="text-gray-600 mb-6">
                Let AI recommend the perfect PC based on your budget, use case,
                and performance requirements.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Budget-based recommendations</li>
                <li>✅ Gaming FPS targeting</li>
                <li>✅ 4500+ PC configurations</li>
                <li>✅ Instant AI analysis</li>
              </ul>
              <div className="mt-6 text-purple-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                Start Building →
              </div>
            </div>
          </Link>

          {/* Manual Build Card */}
          <Link href="/manual-build">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <div className="text-6xl mb-4">🔧</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4 group-hover:text-purple-600 transition-colors">
                Manual Build
              </h2>
              <p className="text-gray-600 mb-6">
                Build your custom PC step-by-step with real-time compatibility
                checking and price tracking.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ 9-step guided selection</li>
                <li>✅ Compatibility validation</li>
                <li>✅ Live price calculation</li>
                <li>✅ Performance prediction</li>
              </ul>
              <div className="mt-6 text-purple-600 font-semibold group-hover:translate-x-2 transition-transform inline-block">
                Start Building →
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-purple-200">
          <p>© 2024 Unicorn PC Builder - Powered by AI & Machine Learning</p>
        </div>
      </div>
    </div>
  );
}
