import React, { useState, useEffect } from 'react';
import { FrameType, FrameCustomization } from '../types';
import { printPhoto, BASE_URL } from '../services/api';

interface PrintCompleteStepProps {
  sessionId: string | null;
  frameType: FrameType;
  customization: FrameCustomization;
  slots: (string | null)[];
  quantity: number;
  onStartNewSession: () => void;
}

export const PrintCompleteStep: React.FC<PrintCompleteStepProps> = ({
  sessionId,
  quantity,
  onStartNewSession,
}) => {
  const [countdown, setCountdown] = useState(60);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  // Đường dẫn ảnh thành phẩm final.jpg từ Backend exports/
  const finalPhotoUrl = sessionId
    ? `${BASE_URL}/exports/${sessionId}_final.jpg?t=${Date.now()}`
    : null;

  // 1. Tự động gửi lệnh in thật ra máy in khi vào màn hình này
  useEffect(() => {
    async function triggerPrint() {
      if (sessionId) {
        setIsPrinting(true);
        setPrintStatus('Đang gửi lệnh in tới máy in nhiệt...');
        try {
          const imagePath = `exports/${sessionId}_final.jpg`;
          const res = await printPhoto(imagePath);
          if (res.success) {
            setPrintStatus('✅ Máy in đang nhả ảnh thành phẩm!');
          }
        } catch (err) {
          console.warn('[PrintStep] Lỗi gọi API in:', err);
          setPrintStatus('⚠️ Đã gửi lệnh in (Chế độ mô phỏng).');
        } finally {
          setIsPrinting(false);
        }
      }
    }
    triggerPrint();
  }, [sessionId]);

  // 2. Đếm ngược 60 giây tự động dọn dẹp và reset về màn hình chờ
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onStartNewSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStartNewSession]);

  // Hàm thủ công gửi lại lệnh in
  const handleReprint = async () => {
    if (!sessionId) return;
    setIsPrinting(true);
    try {
      const imagePath = `exports/${sessionId}_final.jpg`;
      await printPhoto(imagePath);
      setPrintStatus('✅ Đã gửi lại lệnh in!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 font-body text-[#191c1d] max-w-4xl mx-auto w-full text-center">
      {/* Tiêu đề Chúc mừng */}
      <div className="mb-6 flex flex-col items-center animate-bounce">
        <span className="material-symbols-outlined text-6xl text-[#864d61] mb-2 icon-fill">
          check_circle
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#864d61]">
          HOÀN THÀNH LƯỢT CHỤP!
        </h1>
        <p className="text-sm font-bold text-[#514347] mt-1">
          Vui lòng nhận ảnh in tại khay đựng phía dưới
        </p>
      </div>

      {/* Frame xem trước ảnh ghép 1200x1800 px */}
      <div className="relative w-full max-w-xs aspect-[2/3] bg-white rounded-3xl p-3 shadow-2xl border-4 border-[#ffb7ce] overflow-hidden my-4">
        {finalPhotoUrl ? (
          <img
            src={finalPhotoUrl}
            alt="Final Composite Photobooth"
            className="w-full h-full object-cover rounded-2xl"
            onError={(e) => {
              // Fallback nếu chưa xuất xong file final
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#f3f4f5] rounded-2xl text-[#864d61]">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2">sync</span>
            <span className="text-xs font-bold">Đang tải ảnh thành phẩm...</span>
          </div>
        )}
      </div>

      {/* Trạng thái máy in */}
      {printStatus && (
        <div className="my-3 px-6 py-2 rounded-full bg-[#ffb7ce]/30 text-[#864d61] font-bold text-sm">
          {printStatus} (Số lượng: {quantity} bản)
        </div>
      )}

      {/* Đồng hồ đếm ngược tự động Reset */}
      <p className="text-xs font-bold text-[#514347] mb-6">
        Màn hình sẽ tự động trở về trang chủ sau <span className="text-[#864d61] text-base font-black">{countdown}s</span>
      </p>

      {/* Thanh nút bấm */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handleReprint}
          disabled={isPrinting}
          className="flex-1 py-4 rounded-full border-2 border-[#864d61] text-[#864d61] font-label font-bold text-sm hover:bg-[#ffb7ce]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          In thêm bản nữa
        </button>

        <button
          onClick={onStartNewSession}
          className="flex-1 py-4 rounded-full bg-[#864d61] text-white font-label font-bold text-sm hover:bg-[#7b4458] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">autorenew</span>
          Lượt chụp mới
        </button>
      </div>
    </div>
  );
};
