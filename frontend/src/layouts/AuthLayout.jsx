import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ToastContainer } from '../components/common/ToastContainer';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAF9] text-[#172126] p-4 sm:p-6">
      {/* Top Navbar */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#006B68] text-white flex items-center justify-center shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-[#172126] tracking-tight">
              BizClear <span className="text-[#006B68]">AI</span>
            </span>
            <p className="text-[10px] text-[#66757A] font-medium">
              Enterprise Compliance Platform
            </p>
          </div>
        </Link>
      </header>

      {/* Main Form Box */}
      <main className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Bottom info */}
      <footer className="text-center text-xs text-[#66757A] py-2">
        © {new Date().getFullYear()} BizClear AI. Enterprise Compliance Intelligence.
      </footer>

      <ToastContainer />
    </div>
  );
}
