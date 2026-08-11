import { FrameOption, PhotoItem } from '../types';

export const FRAME_OPTIONS: FrameOption[] = [
  {
    id: 'full',
    title: 'Full Size',
    badge: '1 + 1 (2 Ảnh)',
    slotsCount: 4,
    aspectRatio: 'aspect-[2/3]',
    description: 'Khung 4 ô ảnh vuông tiêu chuẩn, in 2 dải photo strip.'
  },
  {
    id: 'big',
    title: 'Big Size',
    badge: '1 + 1 (2 Ảnh Lớn)',
    slotsCount: 2,
    aspectRatio: 'aspect-[3/4]',
    description: 'Khung 2 ô ảnh lớn sắc nét, phù hợp chụp đôi hoặc nhóm.'
  },
  {
    id: 'free',
    title: 'Free Frame',
    badge: '1 Ảnh Tự Do',
    slotsCount: 3,
    aspectRatio: 'aspect-[4/3]',
    description: 'Khung ảnh tự do nghệ thuật với bố cục sticker ngẫu nhiên.'
  }
];

export const SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'sample-1',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaDJYdyMdaq5EN8Nu40ulQd7kaJBT-giEnc3jg1w051IKjhy2JdJkiZp02v4xMmbPEMouAOhgWSC8DlbZkM8VFDvJEnNd5viLLUhplalSGoF5tEi337fCV5TCWhhteXcZRcXoAbTHceMvevud6WlPd70DdaU7MV0EfgOtfAbIoTZ6F1yQOS6lbgQYTJMk8dfyVOzUPS-EyWe3jajgDfm9TXwF-CESINfCx1za18DIvD7fKuD7c50l7',
    timestamp: Date.now() - 100000
  },
  {
    id: 'sample-2',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcyHj43ZwNPEomY-JAvg0fj6b3zne_nPn-Oa0fe5S2wSRYgg1L4YBxKuI1D-j6WUuXC0oYuHOuFmDXD541QK_DBccVF_we7nRiDbnhjj2tzpadALknDkS0DR-gOPnNu_FkgSlhvTSX6DejqZjbtiik3FUt8H2e8odkQc5ZNnAIKQtzRrovqZtM4HJ5tKu8Tn-_kYXYjtCsdGHE1dIBCUzZUXKqHvxFfUn8x4v6Ekm4kyukFMPqpFKs',
    timestamp: Date.now() - 80000
  },
  {
    id: 'sample-3',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzvxiVKO3P3zmfZhgrgGVdW3_xNWAx4WeETxPdN3ZSdED4U9PLwsd-so0rcLXC3ZAen2mFf9zwJ5CDwmWEd0YezYpMLL1gx0dzo-gEqR1V1zuMZQLktY_n3gIqK0s8sZWlzNgLHAf49h0a2UNTcJ_HWIsul8wro3DTlNvqQ4sfbKIrGoumgDgh2cDOGSHa7MC7oaL_-wmbAS9Yo0536uRJ40Dz9h1y8NzrvHNAFG3oPbbGRLkzeNLM',
    timestamp: Date.now() - 60000
  },
  {
    id: 'sample-4',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLthJBpmJwqJGmIxeuSZPJtdCfI5-NncZN4JEcMPsNjQIwgBFbDKwYosmv_n9LQrv9dOnpmvjFVHMMfZ9PPkEDRr_VQYX017kBujLZOrKmJuGq6rfo3ILrq9ue3XDRx6b56oI10f-U7FnxpuiFPFtWImZ9kVhgnOSP1tBxXJm-I6O2iZQCXKRFCwLB37xRbb70JaC_sOa4ngWt6VyPVC0-gFgzm5QLTBDLjyJJIJJhUKqynngcY-F7',
    timestamp: Date.now() - 40000
  },
  {
    id: 'sample-5',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNSx4GfL4K0MAqw7pOXY65nN4dVPj4o7DeNGsSCg2PJv-zszCAhaBSgJRxvPLC7Qts8gRc4dmoATYM__U6AsYzr32UKTYvhVYf9PgoB2UD-UW8DwflkXhV-ODdqTZBCKThCUMqEk3ECk0YPzWLbJC3fjjyQSkbZOcy_2cgVYc4Zr4pUgjQn-fn71uEY0Zo5A6i0_1Gopg8Cs6Nw8NtTFhuby8Ed9CPljdK4AkfDC3ebxkDTlG-UEyU',
    timestamp: Date.now() - 20000
  }
];

export const FRAME_BG_COLORS = [
  { name: 'Trắng Sữa', value: '#ffffff', text: '#191c1d' },
  { name: 'Hồng Strawberry', value: '#ffb7ce', text: '#7b4458' },
  { name: 'Đen Rose', value: '#2e3132', text: '#ffffff' },
  { name: 'Xanh Mint', value: '#b1e9f0', text: '#326b71' },
  { name: 'Tím Lavender', value: '#e2d5f8', text: '#5b3d88' },
  { name: 'Vàng Lemon', value: '#f9e534', text: '#5f5600' }
];

export const FILTER_PRESETS = [
  { id: 'normal', name: 'Tự nhiên', css: 'none' },
  { id: 'kpop-pink', name: 'K-Pop Pink', css: 'saturate(1.25) contrast(1.05) brightness(1.08) hue-rotate(-5deg)' },
  { id: 'vintage-warm', name: 'Vintage Ấm', css: 'sepia(0.25) contrast(1.1) brightness(1.05)' },
  { id: 'bright-soft', name: 'Mịn Sáng', css: 'brightness(1.15) contrast(0.95) saturate(1.1)' },
  { id: 'monochrome', name: 'Trắng Đen', css: 'grayscale(1) contrast(1.15)' }
];
