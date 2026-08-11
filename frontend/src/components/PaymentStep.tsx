import React, { useState } from 'react';
import { PaymentInfo } from '../types';

interface PaymentStepProps {
  paymentInfo: PaymentInfo;
  onUpdateQuantity: (qty: number) => void;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  paymentInfo,
  onUpdateQuantity,
  onPaymentSuccess,
  onBack,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'momo' | 'bank' | 'cash'>('momo');

  const totalAmount = paymentInfo.unitPrice * paymentInfo.quantity - paymentInfo.discount;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowQrModal(false);
      onPaymentSuccess();
    }, 1800);
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 md:p-12 relative z-10 my-auto">
      <div className="w-full max-w-5xl bg-[#ffeef2] rounded-3xl p-6 md:p-12 soft-shadow border border-[#ffd9e3]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Card: Quantity Selection */}
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center soft-shadow text-center min-h-[380px]">
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-[#864d61] mb-2">
              Số lượng ảnh
            </h3>
            <p className="text-[#514347] font-medium mb-10">
              Chọn số lượng bạn muốn in.
            </p>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => onUpdateQuantity(Math.max(1, paymentInfo.quantity - 1))}
                className="w-14 h-14 rounded-full bg-[#ffb7ce]/30 hover:bg-[#ffb7ce]/60 text-[#7b4458] text-2xl font-bold flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              >
                —
              </button>

              <div className="w-24 h-24 rounded-full border-4 border-[#864d61] flex items-center justify-center font-display text-4xl font-extrabold text-[#191c1d] shadow-sm">
                {paymentInfo.quantity}
              </div>

              <button
                onClick={() => onUpdateQuantity(paymentInfo.quantity + 1)}
                className="w-14 h-14 rounded-full bg-[#864d61] hover:bg-[#7b4458] text-white text-2xl font-bold flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Right Card: Payment Summary */}
          <div className="bg-white rounded-2xl p-8 flex flex-col justify-between soft-shadow min-h-[380px]">
            <div>
              <h3 className="font-display text-2xl font-extrabold text-[#864d61] pb-3 border-b border-[#e1e3e4]">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-4 py-6 font-medium text-[#191c1d]">
                <div className="flex justify-between items-center text-base md:text-lg">
                  <span className="text-[#514347]">Đơn giá (1 tấm)</span>
                  <span className="font-bold">{paymentInfo.unitPrice.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className="flex justify-between items-center text-base md:text-lg">
                  <span className="text-[#514347]">Số lượng</span>
                  <span className="font-bold">{paymentInfo.quantity}</span>
                </div>

                <div className="flex justify-between items-center text-base md:text-lg">
                  <span className="text-[#2d666d]">Khuyến mãi</span>
                  <span className="font-bold text-[#2d666d]">-0đ</span>
                </div>

                <div className="border-t border-[#e1e3e4] pt-4 flex justify-between items-center text-base md:text-lg">
                  <span className="text-[#514347]">Đã nạp</span>
                  <span className="font-bold text-[#864d61]">0đ</span>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-lg font-extrabold text-[#191c1d]">Cần thanh toán</span>
                  <span className="font-display text-3xl md:text-4xl font-black text-[#864d61]">
                    {totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="w-full py-4 rounded-2xl bg-[#864d61] hover:bg-[#7b4458] text-white font-display text-lg font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-[0_8px_20px_rgba(134,77,97,0.3)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">payments</span>
                Thanh toán ngay
              </button>

              <button
                onClick={onBack}
                className="w-full py-2.5 text-[#514347] font-bold text-sm hover:underline cursor-pointer"
              >
                Quay lại chọn khung
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal with QR Code / Payment simulation */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center relative soft-shadow border border-[#ffd9e3] animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f3f4f5] hover:bg-[#e1e3e4] flex items-center justify-center text-[#514347] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <h3 className="font-display text-2xl font-bold text-[#864d61] mb-1">
              Quét mã thanh toán
            </h3>
            <p className="text-sm text-[#514347] mb-4">
              Thanh toán <strong className="text-[#864d61]">{totalAmount.toLocaleString('vi-VN')}đ</strong> cho {paymentInfo.quantity} tấm ảnh
            </p>

            {/* Payment Method Selector */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setSelectedMethod('momo')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedMethod === 'momo'
                    ? 'bg-[#a50064] text-white'
                    : 'bg-[#f3f4f5] text-[#514347]'
                }`}
              >
                MoMo
              </button>
              <button
                onClick={() => setSelectedMethod('bank')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedMethod === 'bank'
                    ? 'bg-[#2d666d] text-white'
                    : 'bg-[#f3f4f5] text-[#514347]'
                }`}
              >
                VietQR / Ngân hàng
              </button>
              <button
                onClick={() => setSelectedMethod('cash')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedMethod === 'cash'
                    ? 'bg-[#864d61] text-white'
                    : 'bg-[#f3f4f5] text-[#514347]'
                }`}
              >
                Tiền mặt (Kiosk)
              </button>
            </div>

            {/* Generated QR Mockup */}
            <div className="bg-[#f8f9fa] p-4 rounded-2xl border-2 border-dashed border-[#ffb7ce] mb-6 flex flex-col items-center justify-center">
              {selectedMethod === 'cash' ? (
                <div className="py-8 text-center space-y-3">
                  <span className="material-symbols-outlined text-5xl text-[#864d61]">point_of_sale</span>
                  <p className="font-bold text-base text-[#191c1d]">Vui lòng cho tiền vào khe nhận tiền của cây Kiosk</p>
                  <p className="text-xs text-[#514347]">Mệnh giá nhận: 10k, 20k, 50k, 100k, 200k, 500k</p>
                </div>
              ) : (
                <>
                  <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-inner border border-[#e1e3e4] flex items-center justify-center relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PHOTO_TIME_PAYMENT_${totalAmount}_${Date.now()}`}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white p-1 rounded-full shadow-md">
                        <span className="material-symbols-outlined text-[#864d61] text-xl icon-fill">camera</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#514347] mt-3">Quét mã bằng ứng dụng Ngân hàng hoặc MoMo</p>
                </>
              )}
            </div>

            {/* Action */}
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-[#864d61] hover:bg-[#7b4458] text-white font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {isProcessing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang xác nhận thanh toán...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Xác nhận đã hoàn tất thanh toán
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
