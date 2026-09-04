import { Leaf, Menu, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getUser } from '../utils/auth';

const LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Predict', path: '/predict' },
  // { label: 'Compare', path: '/compare' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = () => setUser(getUser());
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-saturate-150 border-b border-[#E7E3D8] shadow-[0_1px_0_rgba(18,61,42,0.02)]'
          : 'bg-[#F7F6F1]/90 border-b border-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-[#1F5A3F] flex items-center justify-center group-hover:bg-[#123D2A] transition-colors duration-300">
            <Leaf className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#1D2A22]" style={{ fontFamily: 'var(--font-display)' }}>
            NutriPredict
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((item) => (
            <NavLink
              key={item.label}
              to={item.label === 'Predict' && !user ? '/login' : item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-[#1F5A3F]' : 'text-[#6B7280] hover:text-[#1D2A22]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/profile"
              className="hidden sm:inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-[#1F5A3F]/10 hover:bg-[#1F5A3F]/15 text-[#1F5A3F] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#1F5A3F]/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#1F5A3F] hover:bg-[#123D2A] transition-colors duration-200"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#1D2A22] hover:bg-black/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E7E3D8] bg-white px-4 py-4 flex flex-col gap-1 animate-fade-up">
          {LINKS.map((item) => (
            <NavLink
              key={item.label}
              to={item.label === 'Predict' && !user ? '/login' : item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'text-[#1F5A3F] bg-[#1F5A3F]/8' : 'text-[#1D2A22] hover:bg-black/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="h-px bg-[#E7E3D8] my-2" />
          {user ? (
            <Link to="/profile" onClick={closeMobileMenu} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1F5A3F]">
              My Profile
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1F5A3F] text-center"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
