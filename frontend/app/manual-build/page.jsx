"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { manualAPI } from "@/services/api";

export default function ManualBuild() {
  const router = useRouter();

  // Build state
  const [build, setBuild] = useState({
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: null,
    cooler: null,
    storage: null,
    psu: null,
    case: null,
  });

  // Current step (0-8)
  const [currentStep, setCurrentStep] = useState(0);

  // Component options
  const [cpuBrand, setCpuBrand] = useState("Intel");
  const [cpus, setCpus] = useState([]);
  const [motherboards, setMotherboards] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [rams, setRams] = useState([]);
  const [coolers, setCoolers] = useState([]);
  const [storages, setStorages] = useState([]);
  const [psus, setPsus] = useState([]);
  const [cases, setCases] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  const steps = [
    { name: "CPU Brand", icon: "🏷️" },
    { name: "CPU", icon: "🔲" },
    { name: "Motherboard", icon: "🔌" },
    { name: "GPU", icon: "🎮" },
    { name: "RAM", icon: "💾" },
    { name: "Cooler", icon: "❄️" },
    { name: "Storage", icon: "💿" },
    { name: "PSU", icon: "⚡" },
    { name: "Case", icon: "📦" },
  ];

  // Load components based on step
  useEffect(() => {
    loadComponentsForStep();
  }, [currentStep, cpuBrand, build.cpu, build.motherboard, build.gpu]);

  const loadComponentsForStep = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (currentStep) {
        case 1: // CPU
          if (cpuBrand) {
            const data = await manualAPI.getCPUs(cpuBrand);
            setCpus(data);
          }
          break;
        case 2: // Motherboard
          if (build.cpu?.Socket) {
            const data = await manualAPI.getMotherboards(build.cpu.Socket);
            setMotherboards(data);
          }
          break;
        case 3: // GPU
          const gpuData = await manualAPI.getGPUs();
          setGpus(gpuData);
          break;
        case 4: // RAM
          if (build.motherboard?.RAM_Type) {
            const data = await manualAPI.getRAM(build.motherboard.RAM_Type);
            setRams(data);
          }
          break;
        case 5: // Cooler
          if (build.cpu?.Socket) {
            const data = await manualAPI.getCoolers(build.cpu.Socket);
            setCoolers(data);
          }
          break;
        case 6: // Storage
          const storageData = await manualAPI.getStorage();
          setStorages(storageData);
          break;
        case 7: // PSU
          const psuData = await manualAPI.getPSUs();
          setPsus(psuData);
          break;
        case 8: // Case
          if (build.motherboard?.Form_Factor && build.gpu?.Length_cm) {
            const data = await manualAPI.getCases(
              build.motherboard.Form_Factor,
              build.gpu.Length_cm
            );
            setCases(data);
          }
          break;
      }
    } catch (err) {
      setError(
        "Failed to load components. Please check if backend is running."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComponent = (component) => {
    const stepKeys = [
      "brand",
      "cpu",
      "motherboard",
      "gpu",
      "ram",
      "cooler",
      "storage",
      "psu",
      "case",
    ];
    const key = stepKeys[currentStep];

    if (key === "brand") {
      setCpuBrand(component);
      setCurrentStep(1);
    } else {
      setBuild({ ...build, [key]: component });
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await manualAPI.validateBuild(build);
      setValidationResult(result);

      if (result.isValid) {
        // Store in sessionStorage for performance page
        sessionStorage.setItem(
          "buildData",
          JSON.stringify({
            cpu: build.cpu.Name,
            gpu: build.gpu.Name,
            ram: parseInt(build.ram.Capacity.replace("GB", "")),
          })
        );
      }
    } catch (err) {
      setError("Failed to validate build.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictPerformance = () => {
    router.push("/performance");
  };

  const calculateTotalPrice = () => {
    let total = 0;
    Object.values(build).forEach((component) => {
      if (component?.Price) {
        total += parseFloat(component.Price.replace("$", ""));
      }
    });
    return total.toFixed(2);
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      );
    }

    switch (currentStep) {
      case 0: // CPU Brand
        return (
          <div className="grid grid-cols-2 gap-4">
            {["Intel", "AMD"].map((brand) => (
              <button
                key={brand}
                onClick={() => handleSelectComponent(brand)}
                className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="text-4xl mb-2">
                  {brand === "Intel" ? "🔵" : "🔴"}
                </div>
                <div className="font-bold text-xl text-gray-800">{brand}</div>
              </button>
            ))}
          </div>
        );

      case 1: // CPU
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cpus.map((cpu, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(cpu)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{cpu.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Socket: {cpu.Socket} | TDP: {cpu.TDP}W | Price: {cpu.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 2: // Motherboard
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {motherboards.map((mb, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(mb)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{mb.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Form Factor: {mb.Form_Factor} | RAM: {mb.RAM_Type} | Price:{" "}
                  {mb.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 3: // GPU
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {gpus.map((gpu, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(gpu)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{gpu.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  TDP: {gpu.TDP}W | Length: {gpu.Length_cm}cm | Price:{" "}
                  {gpu.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 4: // RAM
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rams.map((ram, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(ram)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{ram.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Capacity: {ram.Capacity} | Type: {ram.RAM_Type} | Price:{" "}
                  {ram.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 5: // Cooler
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {coolers.map((cooler, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(cooler)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{cooler.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Type: {cooler.Type} | Price: {cooler.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 6: // Storage
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {storages.map((storage, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(storage)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{storage.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Capacity: {storage.Capacity} | Type: {storage.Type} | Price:{" "}
                  {storage.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 7: // PSU
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {psus.map((psu, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(psu)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{psu.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Wattage: {psu.Wattage}W | Efficiency: {psu.Efficiency} |
                  Price: {psu.Price}
                </div>
              </button>
            ))}
          </div>
        );

      case 8: // Case
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cases.map((caseItem, index) => (
              <button
                key={index}
                onClick={() => handleSelectComponent(caseItem)}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
              >
                <div className="font-bold text-gray-800">{caseItem.Name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Form Factor: {caseItem.Form_Factor} | Max GPU:{" "}
                  {caseItem.Max_GPU_Length_cm}cm | Price: {caseItem.Price}
                </div>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-4">
            🔧 Manual Build
          </h1>
          <p className="text-xl text-purple-100">
            Step-by-Step PC Component Selection
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                        index === currentStep
                          ? "bg-purple-600 text-white scale-110"
                          : index < currentStep
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      } transition-all`}
                    >
                      {step.icon}
                    </div>
                    <div className="text-xs mt-1 text-gray-600 hidden md:block">
                      {step.name}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / 8) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Component Selection */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {steps[currentStep].icon} {steps[currentStep].name}
              </h2>

              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-6">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    ← Back
                  </button>
                )}

                {currentStep === 8 && build.case && (
                  <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    ✓ Validate Build
                  </button>
                )}
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    validationResult.isValid
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-red-50 border-2 border-red-500"
                  }`}
                >
                  <h3 className="font-bold mb-2">
                    {validationResult.isValid
                      ? "✅ Build is Valid!"
                      : "❌ Validation Issues"}
                  </h3>

                  {validationResult.errors?.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold text-red-700">Errors:</p>
                      <ul className="list-disc list-inside text-red-600">
                        {validationResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.warnings?.length > 0 && (
                    <div>
                      <p className="font-semibold text-yellow-700">Warnings:</p>
                      <ul className="list-disc list-inside text-yellow-600">
                        {validationResult.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.isValid && (
                    <button
                      onClick={handlePredictPerformance}
                      className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                      📊 Predict Performance
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Build Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Build Summary
              </h3>

              <div className="space-y-3">
                {Object.entries(build).map(([key, component]) => (
                  <div key={key} className="border-b border-gray-200 pb-2">
                    <div className="text-xs text-gray-500 uppercase">{key}</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {component ? component.Name : "-"}
                    </div>
                    {component?.Price && (
                      <div className="text-xs text-green-600">
                        {component.Price}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Price:</span>
                  <span className="text-2xl font-black text-green-600">
                    ${calculateTotalPrice()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
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
