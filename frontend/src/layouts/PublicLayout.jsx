import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap, ShieldCheck, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';

export default function PublicLayout() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Academic Services' },
    { to: '/about', label: 'About System' },
    { to: '/verify', label: 'Verify Certificate' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Public Header */}
      <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-200 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold shadow-md shadow-navy-900/20">
              <GraduationCap className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="font-extrabold text-navy-900 text-lg tracking-tight block leading-tight">APEX UNIVERSITY</span>
              <span className="text-[10px] text-teal-600 font-bold tracking-wider uppercase">Academic Workflow Portal</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.to ? 'text-teal-600 font-semibold' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-navy-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-navy-800 hover:bg-navy-900 rounded-xl shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-navy-950 text-slate-400 text-sm py-12 border-t border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-6 h-6 text-teal-400" />
              <span className="font-bold text-white text-base">APEX INSTITUTE OF TECHNOLOGY</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Modern digital academic document workflow system facilitating frictionless issuance of bona fide certificates, transcripts, letters of recommendation, and verification records.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> ISO 9001:2015 & Cryptographic Tamper-Proof Issuance
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/services" className="hover:text-white transition-colors">Available Documents</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">System Architecture</Link></li>
              <li><Link to="/verify" className="hover:text-white transition-colors">Certificate Verification</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Institutional Helpdesk</h4>
            <p className="text-xs text-slate-400 mb-1">Office of the Registrar</p>
            <p className="text-xs text-slate-400 mb-1">registrar@apex.college.edu</p>
            <p className="text-xs text-slate-400">+91 (080) 4567-8900</p>
            <p className="text-[11px] text-slate-500 mt-2">Mon - Fri: 9:00 AM - 5:00 PM</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-navy-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Apex Institute. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Digital Academic Document Workflow System</p>
        </div>
      </footer>
    </div>
  );
}
