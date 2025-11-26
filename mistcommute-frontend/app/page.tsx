"use client";

import Link from "next/link";
import { useApp } from "./providers";
import { APP_ROUTES } from "@/lib/constants";

export default function HomePage() {
  const { isConnected, openConnectModal } = useApp();

  const features = [
    {
      icon: "🔒",
      title: "Privacy First",
      description: "Your commute times stay encrypted on-chain. No personal patterns are exposed to anyone.",
    },
    {
      icon: "📊",
      title: "Community Insights",
      description: "View aggregated congestion trends without individual exposure through FHE computation.",
    },
    {
      icon: "⚡",
      title: "Real-Time Alerts",
      description: "Get notified of congestion changes based on encrypted threshold comparisons.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Connect Wallet",
      description: "Connect your Web3 wallet to get started",
    },
    {
      number: "2",
      title: "Submit Encrypted Data",
      description: "Enter your commute times - they're encrypted before leaving your browser",
    },
    {
      number: "3",
      title: "View Your History",
      description: "Decrypt and analyze your personal commute patterns locally",
    },
    {
      number: "4",
      title: "Explore Community Stats",
      description: "See aggregated congestion trends without exposing individual data",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent animate-gradient py-20 md:py-32">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-heading">
              Private Commute Analytics,
              <br />
              <span className="text-white/90">Powered by FHEVM</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Track your commute patterns without exposing personal data
            </p>
            {isConnected ? (
              <Link href={APP_ROUTES.DASHBOARD} className="inline-block px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Go to Dashboard
              </Link>
            ) : (
              <button
                onClick={openConnectModal}
                className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Connect Wallet & Start
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-heading">
              Why MistCommute?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card text-center"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 font-heading">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-heading">
              How It Works
            </h2>
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 font-heading">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
            Ready to Track Your Commute Privately?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the community and start contributing to privacy-preserving traffic analytics today.
          </p>
          {isConnected ? (
            <Link
              href={APP_ROUTES.SUBMIT}
              className="inline-block px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Submit Your First Commute
            </Link>
          ) : (
            <button
              onClick={openConnectModal}
              className="px-8 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Now
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

