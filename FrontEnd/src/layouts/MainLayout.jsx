import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F7F6F1]">
      <Navbar />

      {/* pt-[72px] offsets the fixed navbar height on every page.
          Home manages its own section spacing, so it skips the extra bottom padding. */}
      <main className={`flex-1 pt-[72px] ${isHome ? '' : 'pb-16'}`}>
        {children}
      </main>
    </div>
  );
}