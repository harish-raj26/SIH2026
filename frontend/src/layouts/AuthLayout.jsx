import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ToastContainer } from '../components/common/ToastContainer';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAF9] text-[#172126] p-4 sm:p-6">
      {/* Top Navbar */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo-cropped.png"
            alt="Byte Forge"
            className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="border-l border-slate-200 pl-3">
            <span className="text-xs font-bold text-[#172126] tracking-tight block">
              Enterprise Compliance
            </span>
            <p className="text-[10px] text-[#66757A] font-medium">
              Regulatory Approval Intelligence
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
        © {new Date().getFullYear()} Byte Forge. Enterprise Compliance Intelligence.
      </footer>

      <ToastContainer />
    </div>
  );
}
