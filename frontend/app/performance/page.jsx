"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performanceAPI } from "@/services/api";

export default function Performance() {
  const router = useRouter();

  const [buildData, setBuildData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get build data from sessionStorage
    const stored = sessionStorage.getItem("buildData");
    if (stored) {
      const data = JSON.parse(stored);
      setBuildData(data);
      predictPerformance(data);
    } else {
      setError("No build data found. Please create a build first.");
      setLoading(false);
    }
  }, []);

  const predictPerformance = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await performanceAPI.predict(data);

      if (result.error) {
        setError(result.error + "\n" + (result.details || ""));
      } else {
        setPrediction(result);
      }
    } catch (err) {
      setError("Failed to predict performance. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBottleneckColor = (percentage) => {
    if (percentage < 10) return "text-green-600";
    if (percentage < 25) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuitabilityColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Analyzing Performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 whitespace-pre-line mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-4">
            📊 Performance Prediction
          </h1>
          <p className="text-xl text-purple-100">
            ML-Powered Performance Analysis
          </p>
        </div>

        {/* Build Info Card */}
        {buildData && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Build
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">CPU</div>
                <div className="font-bold text-lg text-gray-800">
                  {buildData.cpu}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">GPU</div>
                <div className="font-bold text-lg text-gray-800">
                  {buildData.gpu}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">RAM</div>
                <div className="font-bold text-lg text-gray-800">
                  {buildData.ram}GB
                </div>
              </div>
            </div>
            {prediction?.build_info && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">
                  Total Performance Score:{" "}
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {prediction.build_info.total_score}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Performance Results */}
        {prediction?.results && (
          <div className="grid md:grid-cols-3 gap-6">
            {prediction.results.map((result, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-2xl p-6 hover:scale-105 transition-transform"
              >
                {/* Resolution Header */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {result.resolution}
                  </h3>
                </div>

                {/* FPS */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">🎮 FPS</div>
                  <div className="text-4xl font-black text-purple-600">
                    {result.fps}
                  </div>
                </div>

                {/* Gaming Rating */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    ⭐ Gaming Rating
                  </div>
                  <div
                    className={`inline-block px-4 py-2 rounded-full font-bold ${
                      result.gaming_rating === "Excellent"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {result.gaming_rating}
                  </div>
                </div>

                {/* Suitability Score */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    📊 Suitability Score
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${getSuitabilityColor(
                        result.suitability_score
                      )} transition-all duration-1000`}
                      style={{ width: `${result.suitability_score}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm font-bold text-gray-700 mt-1">
                    {result.suitability_score}%
                  </div>
                </div>

                {/* Bottleneck */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">
                    🔧 Bottleneck
                  </div>
                  <div
                    className={`font-bold ${getBottleneckColor(
                      result.bottleneck_pct
                    )}`}
                  >
                    {result.bottleneck_type} ({result.bottleneck_pct}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottleneck Explanation */}
        {prediction?.results && prediction.results[0] && (
          <div className="mt-6 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🔍 Bottleneck Analysis
            </h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              {prediction.results[0].bottleneck_pct < 10 ? (
                <p className="text-gray-700">
                  <span className="font-bold text-green-600">Excellent!</span>{" "}
                  Your build is well-balanced. The{" "}
                  {prediction.results[0].bottleneck_type} bottleneck is minimal
                  ({prediction.results[0].bottleneck_pct}%).
                </p>
              ) : prediction.results[0].bottleneck_pct < 25 ? (
                <p className="text-gray-700">
                  <span className="font-bold text-yellow-600">Good!</span> Your
                  build has a slight {prediction.results[0].bottleneck_type}{" "}
                  bottleneck ({prediction.results[0].bottleneck_pct}%), but it's
                  still well-balanced for most tasks.
                </p>
              ) : (
                <p className="text-gray-700">
                  <span className="font-bold text-red-600">Notice:</span> Your
                  build has a {prediction.results[0].bottleneck_type} bottleneck
                  ({prediction.results[0].bottleneck_pct}%). Consider upgrading
                  your {prediction.results[0].bottleneck_type} for better
                  performance.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => router.push("/intelligent-build")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
          >
            Try Another Build
          </button>
        </div>
      </div>
    </div>
  );
}
