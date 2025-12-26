"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { intelligentAPI } from "@/services/api";

export default function IntelligentBuild() {
  const router = useRouter();

  // Form state
  const [budget, setBudget] = useState(1500);
  const [useCase, setUseCase] = useState("Gaming");
  const [resolution, setResolution] = useState("1440P");
  const [fps, setFps] = useState(120);

  // Options from API
  const [options, setOptions] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  // Load options on mount
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const data = await intelligentAPI.getOptions();
      setOptions(data);
    } catch (err) {
      setError("Failed to load options. Please check if backend is running.");
      console.error(err);
    }
  };

  const handleGetRecommendation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const data = {
        budget: parseInt(budget),
        resolution,
        use_case: useCase,
        fps: useCase === "Gaming" ? parseInt(fps) : null,
      };

      const result = await intelligentAPI.getRecommendation(data);

      if (result.error) {
        setError(
          result.error + (result.suggestion ? "\n" + result.suggestion : "")
        );
      } else {
        setRecommendation(result);

        // Store in sessionStorage for performance page
        sessionStorage.setItem(
          "buildData",
          JSON.stringify({
            cpu: result.CPU,
            gpu: result.GPU,
            ram: result.ram_gb,
          })
        );

        // Auto-redirect to performance page after 2 seconds
        setTimeout(() => {
          router.push("/performance");
        }, 2000);
      }
    } catch (err) {
      setError("Failed to get recommendation. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-4">
            🤖 Intelligent Build
          </h1>
          <p className="text-xl text-purple-100">
            AI-Powered PC Recommendations
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Form */}
          <form onSubmit={handleGetRecommendation} className="space-y-6">
            {/* Use Case */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Use Case
              </label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="Gaming">🎮 Gaming</option>
                <option value="Productivity">💼 Productivity</option>
                <option value="Design/Render">🎨 Design/Render</option>
                <option value="Workstation">🖥️ Workstation</option>
              </select>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-4">
                {options?.resolutions?.map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      resolution === res
                        ? "bg-purple-600 text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* FPS (Gaming only) */}
            {useCase === "Gaming" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target FPS: {fps}
                </label>
                <input
                  type="range"
                  min="60"
                  max="300"
                  step="30"
                  value={fps}
                  onChange={(e) => setFps(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>60 FPS</span>
                  <span>120 FPS</span>
                  <span>240 FPS</span>
                  <span>300 FPS</span>
                </div>
              </div>
            )}

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget: ${budget}
              </label>
              <input
                type="range"
                min={options?.min_price || 500}
                max={options?.max_price || 7000}
                step="50"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${options?.min_price || 500}</span>
                <span>${options?.max_price || 7000}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Getting Recommendation...
                </span>
              ) : (
                "🚀 Get AI Recommendation"
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-red-700 whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Result */}
          {recommendation && (
            <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl animate-fadeIn">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">✅</span>
                <h3 className="text-2xl font-bold text-green-800">
                  Perfect Match Found!
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">CPU</div>
                  <div className="font-bold text-lg text-gray-800">
                    {recommendation.CPU}
                  </div>
                  <div className="text-xs text-gray-500">
                    Score: {recommendation.CPU_Score}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">GPU</div>
                  <div className="font-bold text-lg text-gray-800">
                    {recommendation.GPU}
                  </div>
                  <div className="text-xs text-gray-500">
                    Score: {recommendation.GPU_Score}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">RAM</div>
                  <div className="font-bold text-lg text-gray-800">
                    {recommendation.RAM}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">Price</div>
                  <div className="font-bold text-lg text-green-600">
                    {recommendation.Price}
                  </div>
                </div>
              </div>

              {recommendation.FPS && (
                <div className="bg-white p-4 rounded-lg shadow mb-4">
                  <div className="text-sm text-gray-600 mb-1">
                    Expected FPS @ {recommendation.Resolution}
                  </div>
                  <div className="font-bold text-2xl text-purple-600">
                    {recommendation.FPS} FPS
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-600 animate-pulse">
                Redirecting to Performance Prediction...
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-purple-200 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
