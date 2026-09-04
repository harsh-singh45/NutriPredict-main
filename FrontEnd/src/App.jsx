import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* The Data Collection Form Wizard */}
          <Route path="/predict" element={<ProfileSetup />} />
          
          {/* The Results Dashboard (We will rename this to Results later if needed) */}
          <Route path="/results" element={<Dashboard />} />
          
          <Route path="/profile" element={<Profile />} />
          {/* Placeholder for Compare Page */}
          <Route path="/compare" element={
            <div className="max-w-2xl mx-auto px-4 text-center pt-24 pb-16">
              <span className="section-label">Coming Soon</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-[#1D2A22]">Side-by-Side Diet Comparison</h2>
              <p className="mt-4 text-[#6B7280] text-lg leading-relaxed">
                We're building a dedicated comparison view. For now, run a prediction to see how a diet could work for you.
              </p>
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;