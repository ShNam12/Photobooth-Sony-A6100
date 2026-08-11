import React, { useState, useEffect } from 'react';
import { PhotoItem, FrameType, FrameCustomization } from '../types';
import { getSessionPhotos, compositePhotos, BASE_URL } from '../services/api';

interface ArrangeStepProps {
  sessionId: string | null;
  frameType: FrameType;
  capturedPhotos: PhotoItem[];
  onBackToCamera: () => void;
  onProceedToPrint: (customization: FrameCustomization, slots: (string | null)[]) => void;
}

export const ArrangeStep: React.FC<ArrangeStepProps> = ({
  sessionId,
  frameType,
  capturedPhotos,
  onBackToCamera,
  onProceedToPrint,
}) => {
  // Tự động xác định số lượng slot khung hình theo loại khung người dùng đã chọn
  const slotsCount = frameType === 'full' ? 4 : frameType === 'big' ? 2 : 3;

  const [photoGallery, setPhotoGallery] = useState<PhotoItem[]>(capturedPhotos);
  const [slots, setSlots] = useState<(string | null)[]>(() => {
    const initialSlots: (string | null)[] = Array(slotsCount).fill(null);
    capturedPhotos.forEach((photo, idx) => {
      if (idx < slotsCount) {
        initialSlots[idx] = photo.url;
      }
    });
    return initialSlots;
  });

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [isCompositing, setIsCompositing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customization] = useState<FrameCustomization>({
    title: 'MY MEMORIES',
    bgColor: '#ffffff',
    textColor: '#864d61',
    dateText: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    showHeart: true,
    stickers: ['sparkle'],
    layoutVariant: 1,
  });

  // Lấy danh sách 8 ảnh chụp thật từ Backend nếu có sessionId
  useEffect(() => {
    async function fetchPhotos() {
      if (sessionId) {
        try {
          const res = await getSessionPhotos(sessionId);
          if (res.success && res.photos.length > 0) {
            const fetchedPhotos: PhotoItem[] = res.photo_urls.map((pUrl, idx) => ({
              id: `backend-${idx}`,
              url: `${BASE_URL}${pUrl}`,
              timestamp: Date.now(),
            }));
            setPhotoGallery(fetchedPhotos);
          }
        } catch (err) {
          console.warn('Dùng danh sách ảnh chụp tạm thời:', err);
        }
      }
    }
    fetchPhotos();
  }, [sessionId]);

  const assignPhotoToSlot = (photoUrl: string, slotIdx: number) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[slotIdx] = photoUrl;
      return updated;
    });
  };

  const clearSlot = (slotIdx: number) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[slotIdx] = null;
      return updated;
    });
  };

  // Gọi API ghép ảnh thật sang Backend Python khi bấm XÁC NHẬN IN
  const handleConfirmAndComposite = async () => {
    const selectedPhotos = slots.filter((s): s is string => s !== null);
    if (selectedPhotos.length < slotsCount) {
      setErrorMessage(`Vui lòng chọn đủ ${slotsCount} bức ảnh vào các ô khung!`);
      return;
    }

    setIsCompositing(true);
    setErrorMessage(null);

    if (sessionId) {
      try {
        const res = await compositePhotos(sessionId, selectedPhotos, 'template_01');
        if (res.success) {
          console.log('[ArrangeStep] Đã ghép khung ảnh Backend thành công:', res.final_url);
        }
      } catch (err) {
        console.warn('[ArrangeStep] Lỗi khi gọi API composite Backend, dùng fallback:', err);
      }
    }

    setIsCompositing(false);
    onProceedToPrint(customization, slots);
  };

  return (
    <div className="flex-1 w-full px-4 md:px-10 py-6 flex flex-col lg:flex-row gap-8 items-stretch justify-center">
      {/* 🔴 CỘT BÊN TRÁI: Danh sách 8 ảnh chụp */}
      <div className="w-full lg:w-[48%] flex flex-col justify-between bg-white rounded-3xl p-6 md:p-8 shadow-md border border-[#e1e3e4]">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-2xl font-extrabold text-[#864d61] flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl">collections</span>
              Ảnh đã chụp ({photoGallery.length} tấm)
            </h2>
            <button
              onClick={onBackToCamera}
              className="px-4 py-2 rounded-full bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#864d61] font-label font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              Chụp lại
            </button>
          </div>

          <p className="text-sm font-bold text-[#514347] mb-5">
            Chạm vào ảnh để đưa vào ô vị trí số <span className="text-[#864d61] font-black text-base">{(selectedSlotIndex ?? 0) + 1}</span> (Yêu cầu chọn đủ {slotsCount} tấm)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-1">
            {photoGallery.map((photo, idx) => {
              const isSelected = slots.includes(photo.url);
              return (
                <div
                  key={photo.id || idx}
                  onClick={() => {
                    const targetSlot = selectedSlotIndex !== null ? selectedSlotIndex : slots.findIndex((s) => s === null);
                    if (targetSlot !== -1) {
                      assignPhotoToSlot(photo.url, targetSlot);
                      const nextEmpty = slots.findIndex((s, i) => i > targetSlot && s === null);
                      setSelectedSlotIndex(nextEmpty !== -1 ? nextEmpty : null);
                    }
                  }}
                  className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-3 cursor-pointer transition-all shadow-sm ${isSelected
                      ? 'border-[#864d61] ring-4 ring-[#ffb7ce]/60 scale-95 opacity-90'
                      : 'border-transparent hover:border-[#ffb7ce] hover:scale-102'
                    }`}
                >
                  <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#864d61]/50 backdrop-blur-[1px] flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded-full font-extrabold shadow">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🟡 CỘT BÊN PHẢI: Xem trước Khung ảnh linh hoạt theo 2/3/4 ô */}
      <div className="w-full lg:w-[52%] flex flex-col items-center justify-between bg-white rounded-3xl p-6 md:p-8 shadow-md border border-[#e1e3e4]">
        <div className="w-full flex justify-between items-center mb-4">
          <h3 className="font-display text-2xl font-extrabold text-[#191c1d]">XEM TRƯỚC KHUNG ẢNH</h3>
          <span className="text-xs font-extrabold text-[#864d61] bg-[#ffb7ce]/30 px-4 py-1.5 rounded-full shadow-sm">
            Mẫu {slotsCount} ô (Khổ 1200 x 1800 px)
          </span>
        </div>

        {/* Khung xem trước Photoshop biến đổi linh hoạt */}
        <div
          className="relative w-full max-w-[460px] aspect-[2/3] rounded-3xl shadow-2xl p-5 transition-all flex flex-col justify-between border-4 border-[#ffb7ce]/40"
          style={{ backgroundColor: customization.bgColor }}
        >
          {/* LƯỚI KHUNG 4 Ô */}
          {frameType === 'full' && (
            <div className="grid grid-cols-2 gap-3 flex-1">
              {slots.map((slotUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSlotIndex(idx)}
                  className={`relative aspect-[3/4] bg-[#f8f9fa] rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center cursor-pointer ${selectedSlotIndex === idx ? 'border-[#864d61] ring-4 ring-[#864d61]/40' : 'border-dashed border-[#c1c7ce]'
                    }`}
                >
                  {slotUrl ? (
                    <>
                      <img src={slotUrl} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(idx);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-[#864d61]/70">
                      <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      <span className="text-xs font-bold mt-1">Ô số {idx + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LƯỚI KHUNG 2 Ô */}
          {frameType === 'big' && (
            <div className="flex flex-col gap-4 flex-1">
              {slots.map((slotUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSlotIndex(idx)}
                  className={`relative h-1/2 bg-[#f8f9fa] rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center cursor-pointer ${selectedSlotIndex === idx ? 'border-[#864d61] ring-4 ring-[#864d61]/40' : 'border-dashed border-[#c1c7ce]'
                    }`}
                >
                  {slotUrl ? (
                    <>
                      <img src={slotUrl} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(idx);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-[#864d61]/70">
                      <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      <span className="text-xs font-bold mt-1">Ô số {idx + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LƯỚI KHUNG 3 Ô */}
          {frameType === 'free' && (
            <div className="grid grid-cols-1 gap-3 flex-1">
              {slots.map((slotUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSlotIndex(idx)}
                  className={`relative h-1/3 bg-[#f8f9fa] rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center cursor-pointer ${selectedSlotIndex === idx ? 'border-[#864d61] ring-4 ring-[#864d61]/40' : 'border-dashed border-[#c1c7ce]'
                    }`}
                >
                  {slotUrl ? (
                    <>
                      <img src={slotUrl} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(idx);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-[#864d61]/70">
                      <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      <span className="text-xs font-bold mt-1">Ô số {idx + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-4 pt-3 border-t border-black/10">
            <p className="font-display font-black text-base tracking-widest uppercase" style={{ color: customization.textColor }}>
              {customization.title}
            </p>
            <p className="text-xs font-bold opacity-80" style={{ color: customization.textColor }}>
              {customization.dateText}
            </p>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-red-500 font-bold">{errorMessage}</p>
        )}

        <button
          onClick={handleConfirmAndComposite}
          disabled={isCompositing}
          className="mt-6 w-full max-w-lg py-5 rounded-full bg-[#864d61] text-white font-label font-black text-lg hover:bg-[#7b4458] shadow-xl hover:scale-102 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          {isCompositing ? (
            <>
              <span className="animate-spin material-symbols-outlined text-2xl">sync</span>
              Đang ghép khung 1200x1800 px...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl">print</span>
              XÁC NHẬN GHÉP KHUNG & IN ẢNH
            </>
          )}
        </button>
      </div>
    </div>
  );
};
