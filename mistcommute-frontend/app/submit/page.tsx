"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../providers";
import { useMistCommuteContract } from "@/hooks/useMistCommuteContract";
import { timeToMinutes, CommuteType, APP_ROUTES } from "@/lib/constants";

export default function SubmitPage() {
  const router = useRouter();
  const { provider, account, chainId, isConnected, openConnectModal } = useApp();
  const { submitCommute } = useMistCommuteContract(provider, account, chainId);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [departureTime, setDepartureTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("08:30");
  const [routeName, setRouteName] = useState("");
  const [commuteType, setCommuteType] = useState<CommuteType>(CommuteType.Morning);
  const [status, setStatus] = useState<"idle" | "encrypting" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      openConnectModal();
      return;
    }

    setStatus("encrypting");
    setErrorMessage("");

    try {
      const departureMinutes = timeToMinutes(departureTime);
      const arrivalMinutes = timeToMinutes(arrivalTime);

      if (arrivalMinutes <= departureMinutes) {
        throw new Error("Arrival time must be after departure time");
      }

      setStatus("submitting");

      const result = await submitCommute(
        departureMinutes,
        arrivalMinutes,
        routeName || "Unnamed Route",
        commuteType
      );

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push(APP_ROUTES.DASHBOARD);
        }, 2000);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Failed to submit commute");
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-6 font-heading">Submit Commute</h1>
        <p className="text-xl text-gray-600 mb-8">
          Please connect your wallet to submit commute data
        </p>
        <button onClick={openConnectModal} className="btn-primary">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 font-heading">Submit Commute</h1>
        <p className="text-gray-600 mb-8">
          Your commute data will be encrypted before submission
        </p>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Departure Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Time
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Arrival Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arrival Time
            </label>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Route Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Name (Optional)
            </label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g., Home → Office"
              className="input-field"
            />
          </div>

          {/* Commute Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commute Type
            </label>
            <div className="flex space-x-4">
              {[
                { value: CommuteType.Morning, label: "Morning" },
                { value: CommuteType.Evening, label: "Evening" },
                { value: CommuteType.Other, label: "Other" },
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={commuteType === option.value}
                    onChange={() => setCommuteType(option.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {status === "encrypting" && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700" />
              <span>Encrypting your commute data...</span>
            </div>
          )}

          {status === "submitting" && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700" />
              <span>Submitting to blockchain...</span>
            </div>
          )}

          {status === "success" && (
            <div className="p-4 bg-green-50 text-green-700 rounded-md">
              ✅ Commute encrypted and submitted! Redirecting to Dashboard...
            </div>
          )}

          {status === "error" && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              ❌ {errorMessage}
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="ml-4 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status !== "idle"}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "idle" ? "Submit Encrypted Commute" : "Processing..."}
          </button>
        </form>
      </div>
    </div>
  );
}

