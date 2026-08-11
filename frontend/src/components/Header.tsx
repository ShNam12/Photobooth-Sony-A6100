import React from 'react';
import { AppStep } from '../types';

interface HeaderProps {
  currentStep: AppStep;
  onNavigateStep: (step: AppStep) => void;
  onOpenModal: (type: 'home' | 'support') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onNavigateStep,
  onOpenModal
}) => {
  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="docked full-width top-0 bg-[#f8f9fa] shadow-sm z-40 relative border-b border-[#e1e3e4]">
        <div className="flex items-center justify-between px-6 lg:px-12 py-4 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <button 
            onClick={() => onNavigateStep('frame-select')} 
            className="flex items-center gap-3 text-[#864d61] hover:opacity-90 transition-opacity text-left"
          >
            <span className="material-symbols-outlined text-3xl icon-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
              camera
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              PHOTO TIME
            </h1>
          </button>

          {/* Desktop Nav Cluster */}
          <nav className="hidden md:flex gap-8 items-center">
            <button
              onClick={() => onOpenModal('home')}
              className="text-[#514347] font-display text-lg font-bold hover:text-[#864d61] transition-colors"
            >
              Trang chủ
            </button>

            <button
              onClick={() => onNavigateStep('frame-select')}
              className={`font-display text-lg font-bold transition-all ${
                currentStep === 'frame-select'
                  ? 'text-[#864d61] underline underline-offset-8 decoration-2'
                  : 'text-[#514347] hover:text-[#864d61]'
              }`}
            >
              Khung hình
            </button>

            <button
              onClick={() => onNavigateStep('payment')}
              className={`font-display text-lg font-bold transition-all ${
                currentStep === 'payment'
                  ? 'text-[#864d61] underline underline-offset-8 decoration-2'
                  : 'text-[#514347] hover:text-[#864d61]'
              }`}
            >
              Thanh toán
            </button>

            <button
              onClick={() => onOpenModal('support')}
              className="text-[#514347] font-display text-lg font-bold hover:text-[#864d61] transition-colors"
            >
              Hỗ trợ
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white shadow-[0_-4px_10px_rgba(255,183,206,0.2)] rounded-t-2xl border-t border-[#ffd9e3]">
        <button
          onClick={() => onOpenModal('home')}
          className="flex flex-col items-center justify-center text-[#514347] px-3 py-1 hover:text-[#864d61]"
        >
          <span className="material-symbols-outlined text-xl mb-0.5">home</span>
          <span className="font-label text-xs font-bold">Trang chủ</span>
        </button>

        <button
          onClick={() => onNavigateStep('frame-select')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all ${
            currentStep === 'frame-select'
              ? 'bg-[#ffb7ce] text-[#7b4458] font-bold'
              : 'text-[#514347]'
          }`}
        >
          <span className="material-symbols-outlined text-xl mb-0.5 icon-fill">grid_view</span>
          <span className="font-label text-xs">Khung hình</span>
        </button>

        <button
          onClick={() => onNavigateStep('payment')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all ${
            currentStep === 'payment'
              ? 'bg-[#ffb7ce] text-[#7b4458] font-bold'
              : 'text-[#514347]'
          }`}
        >
          <span className="material-symbols-outlined text-xl mb-0.5">payments</span>
          <span className="font-label text-xs">Thanh toán</span>
        </button>

        <button
          onClick={() => onOpenModal('support')}
          className="flex flex-col items-center justify-center text-[#514347] px-3 py-1 hover:text-[#864d61]"
        >
          <span className="material-symbols-outlined text-xl mb-0.5">help</span>
          <span className="font-label text-xs font-bold">Hỗ trợ</span>
        </button>
      </nav>
    </>
  );
};
