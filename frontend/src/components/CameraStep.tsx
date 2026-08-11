import React, { useState, useEffect, useRef } from 'react';
import { PhotoItem, FrameType } from '../types';
import { FILTER_PRESETS, SAMPLE_PHOTOS } from '../data/mockPhotos';
import { connectLiveviewWebSocket, capturePhoto, BASE_URL } from '../services/api';

interface CameraStepProps {
  sessionId: string | null;
  frameType: FrameType;
  requiredPhotosCount: number;
  onPhotosCaptured: (photos: PhotoItem[]) => void;
  onClose: () => void;
}

export const CameraStep: React.FC<CameraStepProps> = ({
  sessionId,
  frameType,
  requiredPhotosCount,
  onPhotosCaptured,
  onClose,
}) => {
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoItem[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAutoShooting, setIsAutoShooting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('kpop-pink');
  const [useBackendCamera, setUseBackendCamera] = useState(true);
  const [liveviewFrameUrl, setLiveviewFrameUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Gợi ý dáng pose
  const POSE_TIPS = [
    'Tạo dáng giơ 2 ngón tay xòe cười rạng rỡ ✌️',
    'Tạo hình trái tim trên đầu cùng bạn bè ❤️',
    'Chắp tay dưới cằm nháy mắt nhí nhảnh 😉',
    'Cười tự nhiên & chu mỏ đáng yêu 💋',
    'Tạo dáng cá tính nhấc kính râm 🕶️'
  ];

  const currentPoseTip = POSE_TIPS[capturedPhotos.length % POSE_TIPS.length];

  // 1. Khởi tạo kết nối WebSocket lấy luồng Live-view mượt từ Sony A6100 Backend
  useEffect(() => {
    if (!useBackendCamera) return;

    setStatusMessage('Đang kết nối luồng Live-view từ máy ảnh Sony A6100...');
    const cleanupWs = connectLiveviewWebSocket(
      (frameUrl) => {
        setLiveviewFrameUrl(frameUrl);
        setStatusMessage(null);
      },
      (err) => {
        console.warn('Không thể kết nối Liveview WebSocket:', err);
        setStatusMessage('Không kết nối được Camera Backend. Đang dùng ảnh giả lập.');
      }
    );

    return () => {
      cleanupWs();
    };
  }, [useBackendCamera]);

  // Âm thanh shutter bấm máy
  const playShutterSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Ignore audio error
    }
  };

  // 2. Hàm kích hoạt sập khẩu chụp ảnh thật từ Sony A6100 qua API Backend
  const takeSnapshot = async () => {
    playShutterSound();
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    const photoIndex = capturedPhotos.length + 1;
    let photoUrl = '';

    if (useBackendCamera && sessionId) {
      try {
        const res = await capturePhoto(sessionId, photoIndex);
        if (res.success && res.photo_url) {
          photoUrl = `${BASE_URL}${res.photo_url}?t=${Date.now()}`;
        }
      } catch (err) {
        console.error('Lỗi khi gọi API chụp ảnh Backend:', err);
      }
    }

    // Nếu không nối được camera thật, dùng ảnh giả lập làm fallback
    if (!photoUrl) {
      const nextMockIndex = capturedPhotos.length % SAMPLE_PHOTOS.length;
      photoUrl = SAMPLE_PHOTOS[nextMockIndex].url;
    }

    const newPhoto: PhotoItem = {
      id: `captured-${Date.now()}-${photoIndex}`,
      url: photoUrl,
      timestamp: Date.now(),
      filter: activeFilter,
    };

    setCapturedPhotos((prev) => {
      const updated = [...prev, newPhoto];
      if (updated.length >= requiredPhotosCount) {
        setTimeout(() => {
          onPhotosCaptured(updated);
        }, 800);
      }
      return updated;
    });
  };

  // Đếm ngược 3 giây tự động
  const startCountdown = () => {
    if (capturedPhotos.length >= requiredPhotosCount) return;
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      takeSnapshot();

      if (isAutoShooting && capturedPhotos.length + 1 < requiredPhotosCount) {
        setTimeout(() => {
          setCountdown(3);
        }, 1500);
      } else {
        setIsAutoShooting(false);
      }
    }
  }, [countdown]);

  const handleStartAutoSession = () => {
    setIsAutoShooting(true);
    setCountdown(3);
  };

  const handleFinish = () => {
    if (capturedPhotos.length === 0) {
      onPhotosCaptured(SAMPLE_PHOTOS.slice(0, requiredPhotosCount));
    } else {
      onPhotosCaptured(capturedPhotos);
    }
  };

  const selectedFilterObj = FILTER_PRESETS.find((f) => f.id === activeFilter);

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] z-50 flex flex-col font-body text-[#191c1d] overflow-hidden selection:bg-[#ffb7ce]">
      {/* Header Top */}
      <header className="docked full-width top-0 bg-white shadow-sm flex items-center justify-between px-6 md:px-12 py-4 w-full z-50 border-b border-[#e1e3e4]">
        <div className="flex items-center gap-3 text-[#864d61]">
          <span className="material-symbols-outlined text-3xl icon-fill">photo_camera</span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            SONY A6100 STUDIO
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseBackendCamera(!useBackendCamera)}
            className="px-3 py-1.5 rounded-full bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#514347] font-label text-xs font-bold transition-colors hidden md:flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">videocam</span>
            {useBackendCamera ? 'Sony A6100 Liveview' : 'Ảnh Mẫu Demo'}
          </button>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-[#f3f4f5] hover:bg-[#e1e3e4] flex items-center justify-center text-[#191c1d] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      {/* Frame Live-view */}
      <main className="flex-1 relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        {/* Flash Effect */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200 pointer-events-none"></div>
        )}

        {/* Pose Suggestion */}
        <div className="mb-3 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full border border-[#ffb7ce] shadow-sm flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[#864d61] text-lg">auto_awesome</span>
          <span className="font-label text-xs md:text-sm font-bold text-[#864d61]">
            Gợi ý pose: {currentPoseTip}
          </span>
        </div>

        {/* Viewport Liveview */}
        <div className="relative w-full max-w-4xl h-full max-h-[75vh] rounded-[2rem] overflow-hidden shadow-2xl bg-black border-4 border-white">

          {useBackendCamera && liveviewFrameUrl ? (
            <img
              src={liveviewFrameUrl}
              alt="Sony A6100 Liveview Stream"
              className="w-full h-full object-cover transition-all duration-100"
              style={{ filter: selectedFilterObj?.css || 'none' }}
            />
          ) : (
            <img
              src={SAMPLE_PHOTOS[capturedPhotos.length % SAMPLE_PHOTOS.length].url}
              alt="Camera feed simulation"
              className="w-full h-full object-cover transition-all duration-300"
              style={{ filter: selectedFilterObj?.css || 'none' }}
            />
          )}

          {/* Overlays */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8 pointer-events-none">
            <div className="flex justify-between items-start z-10 w-full pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 text-white font-label text-xs font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                SONY A6100 LIVE 30FPS
              </div>

              <button
                onClick={() => {
                  const filterKeys = FILTER_PRESETS.map((f) => f.id);
                  const nextIndex = (filterKeys.indexOf(activeFilter) + 1) % filterKeys.length;
                  setActiveFilter(filterKeys[nextIndex]);
                }}
                className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-label text-xs font-bold flex items-center gap-2 hover:bg-black/70 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">palette</span>
                Filter: {selectedFilterObj?.name}
              </button>
            </div>

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="flex-1 flex items-center justify-center z-20 pointer-events-none">
                <span className="text-[140px] md:text-[180px] font-display font-extrabold text-white countdown-shadow animate-bounce">
                  {countdown === 0 ? 'CHEESE!' : countdown}
                </span>
              </div>
            )}

            {/* Progress status */}
            <div className="w-full z-10 pointer-events-auto">
              <div className="flex justify-between items-end mb-3 text-white">
                <span className="font-display text-xl md:text-2xl font-bold drop-shadow-md">
                  Đã chụp: {capturedPhotos.length} / {requiredPhotosCount} tấm
                </span>

                <div className="flex gap-2">
                  {capturedPhotos.map((p, idx) => (
                    <div
                      key={p.id}
                      className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/80 shadow-md"
                    >
                      <img src={p.url} alt={`Snap ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full h-2.5 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-[#fab3ca] rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(capturedPhotos.length / requiredPhotosCount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

          </div>
        </div>

        {/* Shutter Toolbar */}
        <div className="mt-4 flex items-center gap-4 z-30">
          <button
            onClick={handleStartAutoSession}
            disabled={countdown !== null || capturedPhotos.length >= requiredPhotosCount}
            className="px-6 py-3 rounded-full bg-[#b1e9f0] text-[#326b71] font-label font-bold text-sm hover:bg-[#86dce8] transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">timer</span>
            Tự động chụp liên tiếp 8 tấm
          </button>

          <button
            onClick={startCountdown}
            disabled={countdown !== null || capturedPhotos.length >= requiredPhotosCount}
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#864d61] text-white flex items-center justify-center hover:bg-[#7b4458] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(134,77,97,0.4)] shutter-ring cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-3xl md:text-4xl icon-fill">photo_camera</span>
          </button>

          {capturedPhotos.length > 0 && (
            <button
              onClick={handleFinish}
              className="px-6 py-3 rounded-full bg-[#864d61] text-white font-label font-bold text-sm hover:bg-[#7b4458] transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              Chọn 4 ảnh ({capturedPhotos.length}/8)
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          )}
        </div>

        {statusMessage && (
          <p className="mt-2 text-xs text-[#864d61] font-bold text-center">
            {statusMessage}
          </p>
        )}
      </main>
    </div>
  );
};
