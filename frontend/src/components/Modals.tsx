import React from 'react';

interface ModalsProps {
  type: 'home' | 'support' | null;
  onClose: () => void;
  onStartShoot: () => void;
}

export const Modals: React.FC<ModalsProps> = ({ type, onClose, onStartShoot }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full relative soft-shadow border border-[#ffd9e3] animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f3f4f5] hover:bg-[#e1e3e4] flex items-center justify-center text-[#514347] transition-colors cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {type === 'home' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-[#864d61] icon-fill mb-2">
                camera
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-extrabold text-[#864d61]">
                PHOTO TIME - Kiosk Chụp Ảnh
              </h3>
              <p className="text-sm text-[#514347] mt-1">
                Trải nghiệm studio chụp ảnh tự động phong cách Hàn Quốc dễ thương & chất lượng cao.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#ffeef2] p-4 rounded-2xl text-center">
                <span className="material-symbols-outlined text-2xl text-[#864d61] mb-1">style</span>
                <h4 className="font-bold text-xs text-[#864d61]">Khung Đa Dạng</h4>
                <p className="text-[11px] text-[#514347]">Full Size, Big Size, Free Frame</p>
              </div>

              <div className="bg-[#b1e9f0]/30 p-4 rounded-2xl text-center">
                <span className="material-symbols-outlined text-2xl text-[#326b71] mb-1">palette</span>
                <h4 className="font-bold text-xs text-[#326b71]">Filter Hàn Quốc</h4>
                <p className="text-[11px] text-[#514347]">Mịn da K-Pop, Vintage, Sáng trong</p>
              </div>

              <div className="bg-[#f9e534]/30 p-4 rounded-2xl text-center">
                <span className="material-symbols-outlined text-2xl text-[#5f5600] mb-1">print</span>
                <h4 className="font-bold text-xs text-[#5f5600]">In Siêu Tốc</h4>
                <p className="text-[11px] text-[#514347]">In sắc nét 15s + QR tải HD</p>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4] text-xs text-[#514347] space-y-2">
              <p className="font-bold text-sm text-[#191c1d]">📌 Hướng dẫn nhanh:</p>
              <p>1. Chọn kiểu khung ảnh yêu thích (Full Size / Big Size / Free Frame).</p>
              <p>2. Chọn số lượng dải ảnh cần in và thanh toán.</p>
              <p>3. Tạo dáng trước camera và chụp lại những khoảnh khắc đáng nhớ.</p>
              <p>4. Tùy chỉnh màu khung, sticker và in ngay!</p>
            </div>

            <button
              onClick={() => {
                onClose();
                onStartShoot();
              }}
              className="w-full py-3.5 rounded-full bg-[#864d61] hover:bg-[#7b4458] text-white font-display text-base font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              Bắt đầu chọn khung ngay
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        )}

        {type === 'support' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-[#2d666d] mb-2">
                support_agent
              </span>
              <h3 className="font-display text-2xl font-extrabold text-[#2d666d]">
                Trung tâm Hỗ trợ PHOTO TIME
              </h3>
              <p className="text-sm text-[#514347] mt-1">
                Giải đáp thắc mắc và hỗ trợ sự cố khi sử dụng cây Kiosk
              </p>
            </div>

            <div className="space-y-3 text-xs text-[#191c1d]">
              <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4]">
                <h4 className="font-bold text-sm text-[#864d61] mb-1">❓ Tôi không nhận được ảnh in?</h4>
                <p className="text-[#514347]">
                  Vui lòng kiểm tra khay nhả ảnh ở phía dưới Kiosk hoặc nhấn nút hỗ trợ kỹ thuật bên dưới.
                </p>
              </div>

              <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4]">
                <h4 className="font-bold text-sm text-[#864d61] mb-1">❓ Mã QR tải ảnh bị lỗi?</h4>
                <p className="text-[#514347]">
                  Bạn có thể nhấn nút "Tải file ảnh PNG HD về máy" hoặc chụp lại màn hình hóa đơn để nhận hỗ trợ lại.
                </p>
              </div>

              <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4]">
                <h4 className="font-bold text-sm text-[#864d61] mb-1">📞 Hotline Kỹ Thuật 24/7</h4>
                <p className="font-bold text-base text-[#2d666d] mt-1">1900 - 888 - 999</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#2d666d] hover:bg-[#204e54] text-white font-bold text-sm transition-all shadow-md cursor-pointer"
            >
              Đóng cửa sổ hỗ trợ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
