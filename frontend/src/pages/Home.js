import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      title: 'For Riders',
      description: 'Find nearby buses and see real-time ETAs',
      icon: '🧍',
      link: '/rider',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'For Drivers',
      description: 'Start tracking your bus location',
      icon: '🚌',
      link: '/driver',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Admin Panel',
      description: 'Manage stops, routes, and assignments',
      icon: '⚙️',
      link: '/admin',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="text-8xl mb-4">🐌</div>
        <h1 className="text-5xl font-bold text-ucsc-blue mb-4">
          SlugStop
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Real-time bus tracking for UC Santa Cruz
        </p>
        <div className="bg-ucsc-yellow text-ucsc-blue px-6 py-3 rounded-lg inline-block font-semibold">
          Live tracking • Real-time ETAs • Easy to use
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className={`${feature.color} text-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 block`}
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-blue-100">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-ucsc-blue">
          How SlugStop Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">
              Bus drivers share their location every 3 seconds for accurate tracking
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🧭</div>
            <h3 className="text-xl font-semibold mb-2">Smart ETAs</h3>
            <p className="text-gray-600">
              Advanced algorithms calculate arrival times based on routes and traffic
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Easy Access</h3>
            <p className="text-gray-600">
              Simple web interface works on any device - no app download required
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-100 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-ucsc-blue">
          Quick Actions
        </h2>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/rider"
            className="btn-primary flex items-center space-x-2"
          >
            <span>🧍</span>
            <span>Find My Bus</span>
          </Link>
          
          <Link
            to="/driver"
            className="btn-success flex items-center space-x-2"
          >
            <span>🚌</span>
            <span>Start Driving</span>
          </Link>
          
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  const { latitude, longitude } = position.coords;
                  window.location.href = `/rider?lat=${latitude}&lon=${longitude}`;
                });
              }
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>📍</span>
            <span>Use My Location</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
