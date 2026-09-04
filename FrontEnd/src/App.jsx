import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import ResetPassword from './pages/ResetPassword';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import { getUser } from './utils/auth';

function ProtectedPredictionRoute() {
  const location = useLocation();

  return getUser() ? <ProfileSetup /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* The Data Collection Form Wizard */}
          <Route path="/predict" element={<ProtectedPredictionRoute />} />
          
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