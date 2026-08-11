import React from 'react';
import { FrameType } from '../types';
import { FRAME_OPTIONS } from '../data/mockPhotos';

interface FrameSelectStepProps {
  selectedFrame: FrameType;
  onSelectFrame: (frameId: FrameType) => void;
  onNext: () => void;
  onBack: () => void;
}

export const FrameSelectStep: React.FC<FrameSelectStepProps> = ({
  selectedFrame,
  onSelectFrame,
  onNext,
  onBack,
}) => {
  return (
    <div className="flex-grow flex flex-col pt-8 md:pt-12 pb-32 px-4 md:px-12 container mx-auto max-w-7xl relative z-10">
      {/* Title Header */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-display text-3xl md:text-5xl text-[#864d61] font-extrabold mb-3 tracking-tight">
          Chọn khung ảnh của bạn
        </h2>
        <p className="text-base md:text-lg text-[#514347] font-medium">
          Lựa chọn kiểu khung yêu thích để bắt đầu chụp ảnh nhé!
        </p>
      </div>

      {/* Frame Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
        {FRAME_OPTIONS.map((frame) => {
          const isSelected = selectedFrame === frame.id;
          return (
            <div
              key={frame.id}
              onClick={() => onSelectFrame(frame.id)}
              className={`frame-card bg-white rounded-3xl p-6 border-2 flex flex-col items-center cursor-pointer relative overflow-hidden soft-shadow ${
                isSelected
                  ? 'selected border-[#864d61] border-4'
                  : 'border-[#d5c2c6] hover:border-[#864d61]/60'
              }`}
            >
              {/* Frame Card Graphic Preview */}
              <div className="w-full aspect-[3/4] bg-[#f3f4f5] rounded-2xl mb-6 flex p-4 flex-col justify-center items-center overflow-hidden">
                {frame.id === 'full' && (
                  <div className="w-full h-full flex flex-col gap-2">
                    <div className="flex gap-2 h-1/2">
                      <div className="bg-white w-1/2 rounded-lg h-full flex items-center justify-center border border-[#e1e3e4]">
                        <span className="material-symbols-outlined text-[#e1e3e4] text-4xl">image</span>
                      </div>
                      <div className="bg-white w-1/2 rounded-lg h-full flex items-center justify-center border border-[#e1e3e4]">
                        <span className="material-symbols-outlined text-[#e1e3e4] text-4xl">image</span>
                      </div>
                    </div>
                    <div className="flex gap-2 h-1/2">
                      <div className="bg-white w-1/2 rounded-lg h-full flex items-center justify-center border border-[#e1e3e4]">
                        <span className="material-symbols-outlined text-[#e1e3e4] text-4xl">image</span>
                      </div>
                      <div className="bg-white w-1/2 rounded-lg h-full flex items-center justify-center border border-[#e1e3e4]">
                        <span className="material-symbols-outlined text-[#e1e3e4] text-4xl">image</span>
                      </div>
                    </div>
                  </div>
                )}

                {frame.id === 'big' && (
                  <div className="w-full h-full flex flex-col gap-3">
                    <div className="bg-white w-full h-1/2 rounded-xl flex items-center justify-center border border-[#e1e3e4]">
                      <span className="material-symbols-outlined text-[#e1e3e4] text-5xl">image</span>
                    </div>
                    <div className="bg-white w-full h-1/2 rounded-xl flex items-center justify-center border border-[#e1e3e4]">
                      <span className="material-symbols-outlined text-[#e1e3e4] text-5xl">image</span>
                    </div>
                  </div>
                )}

                {frame.id === 'free' && (
                  <div className="bg-white w-full h-full rounded-xl flex flex-wrap content-start p-3 gap-2 relative overflow-hidden border border-[#e1e3e4]">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#d9dadb] text-5xl opacity-40">
                        auto_awesome
                      </span>
                    </div>
                    <div className="w-[45%] h-[45%] bg-[#d9dadb] rounded-lg shadow-sm"></div>
                    <div className="w-[30%] h-[30%] bg-[#d9dadb] rounded-lg shadow-sm absolute bottom-4 right-4 rotate-12"></div>
                    <div className="w-[22%] h-[42%] bg-[#d9dadb] rounded-lg shadow-sm absolute top-4 right-6 -rotate-6"></div>
                  </div>
                )}
              </div>

              {/* Title & Badge */}
              <h3 className="font-display text-2xl text-[#191c1d] text-center font-bold mb-2">
                {frame.title}
              </h3>
              <div className="bg-[#b1e9f0] text-[#326b71] px-4 py-1.5 rounded-full font-label text-sm font-bold tracking-wide">
                {frame.badge}
              </div>

              {/* Selection Checkmark Badge */}
              <div
                className={`selection-indicator absolute top-4 right-4 bg-[#864d61] text-white rounded-full p-1.5 transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="material-symbols-outlined text-base block font-bold">check</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Navigation Buttons */}
      <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/90 to-transparent z-30 pointer-events-none">
        <div className="container mx-auto max-w-7xl flex justify-between items-center pointer-events-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="bg-[#e1e3e4] text-[#191c1d] font-display text-lg font-bold px-8 py-3 rounded-full flex items-center gap-2 hover:bg-[#d9dadb] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            BACK
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="bg-[#864d61] text-white font-display text-lg font-bold px-10 py-3 rounded-full flex items-center gap-2 hover:bg-[#7b4458] hover:scale-105 transition-all shadow-[0_8px_20px_rgba(134,77,97,0.35)] cursor-pointer"
          >
            NEXT
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
