export type AppStep = 'frame-select' | 'payment' | 'camera' | 'arrange' | 'print-complete';

export type FrameType = 'full' | 'big' | 'free';

export interface FrameOption {
  id: FrameType;
  title: string;
  badge: string;
  slotsCount: number;
  aspectRatio: string;
  description: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  timestamp: number;
  filter?: string;
}

export interface FrameSlot {
  id: number;
  photoId: string | null;
}

export interface FrameCustomization {
  title: string;
  bgColor: string;
  textColor: string;
  dateText: string;
  showHeart: boolean;
  stickers: string[];
  layoutVariant: 1 | 2;
}

export interface PaymentInfo {
  unitPrice: number;
  quantity: number;
  discount: number;
  deposited: number;
  isPaid: boolean;
  method: 'cash' | 'momo' | 'bank';
}
