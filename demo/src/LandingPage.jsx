import React from 'react';
import { Clock, CheckCircle, ArrowRight, Users, BarChart3, Shield, Zap } from 'lucide-react';

export function LandingPage({ onLoginClick, onSignupClick }) {
  const features = [
    {
      icon: Clock,
      title: 'Real-Time Tracking',
      description: 'Track time with precision using our intuitive timer or manual entry system.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get insights into your time allocation with detailed reports and visualizations.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Manage projects, assign roles, and collaborate seamlessly with your team.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy controls.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed with a modern, responsive interface that works everywhere.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shared Auth Demo</h1>
                <p className="text-xs text-gray-500">Authentication Components</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={onSignupClick}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Reusable Authentication Components</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Secure Auth.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Easy Integration.
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Professional authentication components with email verification, 
              ready to use in any React application. Test the login and signup modals above.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onSignupClick}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2"
              >
                Try Sign Up
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onLoginClick}
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-200"
              >
                Test Login
              </button>
            </div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-delay-2s"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-delay-4s"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for authentication
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional components designed to streamline your authentication flow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to test the components?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Click the Login or Get Started buttons in the top right to test the authentication modals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignupClick}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Test Sign Up Modal
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLoginClick}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
            >
              Test Login Modal
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Shared Auth Components</span>
            </div>
            <p className="text-sm mb-4">
              Reusable authentication components for React applications
            </p>
            <p className="text-xs">
              &copy; {new Date().getFullYear()} Shared Auth Components Demo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

