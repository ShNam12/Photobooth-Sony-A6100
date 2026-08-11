import React, { useState } from 'react';
import { AppStep, FrameType, PhotoItem, PaymentInfo, FrameCustomization } from './types';
import { Header } from './components/Header';
import { FrameSelectStep } from './components/FrameSelectStep';
import { PaymentStep } from './components/PaymentStep';
import { CameraStep } from './components/CameraStep';
import { ArrangeStep } from './components/ArrangeStep';
import { PrintCompleteStep } from './components/PrintCompleteStep';
import { Modals } from './components/Modals';
import { startSession, endSession } from './services/api';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('frame-select');
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('full');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    unitPrice: 50000,
    quantity: 2,
    discount: 0,
    deposited: 0,
    isPaid: false,
    method: 'momo',
  });
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoItem[]>([]);
  const [frameCustomization, setFrameCustomization] = useState<FrameCustomization>({
    title: 'MY MEMORIES',
    bgColor: '#ffffff',
    textColor: '#864d61',
    dateText: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    showHeart: true,
    stickers: [],
    layoutVariant: 1,
  });
  const [arrangedSlots, setArrangedSlots] = useState<(string | null)[]>([]);
  const [activeModal, setActiveModal] = useState<'home' | 'support' | null>(null);

  // Navigation handlers
  const handleSelectFrame = (frameId: FrameType) => {
    setSelectedFrame(frameId);
  };

  const handleUpdateQuantity = (qty: number) => {
    setPaymentInfo((prev) => ({ ...prev, quantity: qty }));
  };

  // Khởi tạo Session thật từ Backend khi hoàn tất thanh toán chuẩn bị vào màn hình chụp
  const handlePaymentSuccess = async () => {
    setPaymentInfo((prev) => ({ ...prev, isPaid: true }));
    try {
      const res = await startSession();
      if (res.success) {
        setSessionId(res.session_id);
        console.log('[App] Đã khởi tạo Backend Session thành công:', res.session_id);
      }
    } catch (err) {
      console.warn('[App] Lỗi kết nối Backend API khởi tạo session, sử dụng fallback session local:', err);
      setSessionId(`session_fallback_${Date.now()}`);
    }
    setCurrentStep('camera');
  };

  const handlePhotosCaptured = (photos: PhotoItem[]) => {
    setCapturedPhotos(photos);
    setCurrentStep('arrange');
  };

  const handleProceedToPrint = (customization: FrameCustomization, slots: (string | null)[]) => {
    setFrameCustomization(customization);
    setArrangedSlots(slots);
    setCurrentStep('print-complete');
  };

  const handleStartNewSession = () => {
    if (sessionId) {
      endSession(sessionId);
    }
    setSessionId(null);
    setCapturedPhotos([]);
    setArrangedSlots([]);
    setPaymentInfo((prev) => ({ ...prev, isPaid: false }));
    setCurrentStep('frame-select');
  };

  // Số lượng ảnh cần chụp (đối với mẫu Full 4 ô, Big 2 ô, mặc định 8 tấm chụp chọn)
  const requiredPhotosCount = 8;

  return (
    <div className="min-h-screen flex flex-col font-body bg-[#f8f9fa] text-[#191c1d] selection:bg-[#ffb7ce]">
      {/* Header - Hỗ trợ các nút điều hướng */}
      {currentStep !== 'camera' && (
        <Header
          currentStep={currentStep}
          onNavigateStep={(step) => setCurrentStep(step)}
          onOpenModal={(type) => setActiveModal(type)}
        />
      )}

      {/* Màn hình 1: Chọn Khung */}
      {currentStep === 'frame-select' && (
        <FrameSelectStep
          selectedFrame={selectedFrame}
          onSelectFrame={handleSelectFrame}
          onNext={() => setCurrentStep('payment')}
          onBack={() => setActiveModal('home')}
        />
      )}

      {/* Màn hình 2: Thanh toán */}
      {currentStep === 'payment' && (
        <PaymentStep
          paymentInfo={paymentInfo}
          onUpdateQuantity={handleUpdateQuantity}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={() => setCurrentStep('frame-select')}
        />
      )}

      {/* Màn hình 3: Soi gương Liveview & Chụp ảnh Sony A6100 */}
      {currentStep === 'camera' && (
        <CameraStep
          sessionId={sessionId}
          frameType={selectedFrame}
          requiredPhotosCount={requiredPhotosCount}
          onPhotosCaptured={handlePhotosCaptured}
          onClose={() => setCurrentStep('payment')}
        />
      )}

      {/* Màn hình 4: Chọn 4/8 ảnh & Sắp xếp khung */}
      {currentStep === 'arrange' && (
        <ArrangeStep
          sessionId={sessionId}
          frameType={selectedFrame}
          capturedPhotos={capturedPhotos}
          onBackToCamera={() => setCurrentStep('camera')}
          onProceedToPrint={handleProceedToPrint}
        />
      )}

      {/* Màn hình 5: Xem thành phẩm & In ảnh */}
      {currentStep === 'print-complete' && (
        <PrintCompleteStep
          sessionId={sessionId}
          frameType={selectedFrame}
          customization={frameCustomization}
          slots={arrangedSlots}
          quantity={paymentInfo.quantity}
          onStartNewSession={handleStartNewSession}
        />
      )}

      {/* Các Modals thông báo */}
      <Modals
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onStartShoot={() => setCurrentStep('frame-select')}
      />
    </div>
  );
}
