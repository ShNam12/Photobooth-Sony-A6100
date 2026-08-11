# PROJECT SPECIFICATION: PHOTOBOOTH STANDALONE APPLICATION

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
* **Tên dự án:** Photobooth Desktop Standalone System
* **Mục tiêu:** Xây dựng phần mềm Photobooth hoàn chỉnh kết nối với máy ảnh Sony A6100, tự động hóa luồng chụp 8 ảnh, chọn 4 ảnh, ghép khung sự kiện và in tự động.
* **Mô hình kiến trúc:** Local Client-Server (FastAPI Backend + Web HTML/CSS/JS Kiosk Frontend)
* **Hệ điều hành mục tiêu:** Windows 10/11 (Standalone, 100% Offline Capability)

---

## 2. THIẾT BỊ & PHẦN CỨNG (HARDWARE CONFIGURATION)

### 2.1. Máy ảnh Sony A6100
* **Cổng kết nối:** Cổng **Multi / Micro-USB** (Cổng trên cùng trong cụm kết nối bên hông).
* **Loại cáp:** Cáp Micro-USB sang USB-A/C (Cáp truyền dữ liệu cao cấp - Data Cable, hỗ trợ PTP).
* **Cấu hình Menu trên A6100:**
  * `MENU` -> `Setup` -> `USB Connection` -> Chọn **PC Remote**.
  * `MENU` -> `PC Remote Settings` -> `Still Image Save Dest` -> Chọn **PC + Camera**.
  * `Quality` -> Chọn **JPEG Fine** (Không chọn RAW để tối ưu tốc độ truyền tải USB).
* **Nguồn điện:** Dummy Battery AC-PW20 cắm điện trực tiếp 220V.

### 2.2. Máy tính & Máy in
* **Máy tính:** Laptop / Mini PC (CPU Core i5+, RAM 16GB, SSD).
* **Máy in:** Máy in nhiệt chuyên dụng (DNP DS-RX1HS / Canon Selphy).
* **Khổ giấy & Độ phân giải:** Khổ 4x6 inch (10x15 cm) ở chuẩn **300 DPI** tương ứng kích thước **1200 x 1800 pixels**.

---

## 3. KIẾN TRÚC PHẦN MỀM & TECH STACK

```text
[Sony A6100] <──USB (PTP)──> [Python Backend (FastAPI)] <──WebSocket / HTTP──> [Chrome Kiosk Frontend]
                                      │
                                      └──> [Windows Spooler (Printer)]
```

### 3.1. Backend (Python 3.10+)
* **Framework:** FastAPI + Uvicorn (ASGI Server).
* **Camera Control:** python-gphoto2 (Điều khiển máy ảnh qua PTP).
* **Image Processing Engine:** Pillow (PIL), OpenCV (cv2).
* **Print Engine:** win32print, win32ui (Silent Print qua Windows Spooler).
* **Concurrency:** threading, asyncio (Tách riêng Worker Thread cho Camera I/O).

### 3.2. Frontend (Kiosk Web UI)
* **Tech:** HTML5, CSS3 (Flexbox/Grid, CSS Animations), Vanilla JavaScript.
* **Container:** Google Chrome chạy ở chế độ `--kiosk` (Toàn màn hình, ẩn URL, ẩn con trỏ chuột).
* **Streaming Protocol:** WebSocket (Stream luồng Live-view mượt mà 24-30 FPS).

---

## 4. LUỒNG NGHIỆP VỤ (BUSINESS WORKFLOW)

```text
[Màn hình CHỜ] ──> [Chọn KHUNG] ──> [Chụp 8 ảnh (30s/ảnh)] ──> [Chọn 4/8 ảnh] ──> [Ghép khung] ──> [Tự động IN] ──> [RESET Session]
```

### State 1: Idle & Select Template
* UI hiển thị danh sách khung ảnh mẫu (`.png` trong suốt).
* Khách bấm "BẮT ĐẦU CHỤP". Backend khởi tạo `session_id` và thư mục tạm `/temp/{session_id}/`.

### State 2: Countdown & Capture (Lặp 8 lần)
* Frontend nhận luồng Live-view real-time từ `/ws/liveview`.
* UI đếm ngược 30 giây (CSS Animation + Beep sound).
* Khi về 0: Gửi request `/api/capture`.
* Camera sập khẩu, tải file `.jpg` về `/temp/{session_id}/photo_x.jpg`. Màn hình chớp Flash trắng.
* Tiến trình lặp lại tự động cho đến khi đủ 8 ảnh.

### State 3: Photo Selection
* Hiển thị Grid 8 ảnh vừa chụp.
* Khách hàng chạm chọn 4 ảnh ưng ý theo thứ tự vị trí 1, 2, 3, 4.

### State 4: Compositing & Print
* Backend nhận 4 ID ảnh. Hàm `ImageService` dùng Pillow thực hiện Center-Crop, resize về đúng kích thước slot, paste vào Canvas 1200 x 1800 px, phủ khung PNG trong suốt lên trên.
* Xuất file thành phẩm `/exports/{session_id}_final.jpg`.
* Khách xem lại ảnh trên màn hình -> Bấm "IN ẢNH" -> Backend đẩy file ra `win32print`.
* Hệ thống tự động dọn dẹp file tạm và reset về State 1 sau 60s timeout.

---

## 5. BẢN CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```text
photobooth_app/
│
├── assets/                  # Tài nguyên hệ thống
│   ├── templates/          # Chứa file khung PNG 1200x1800 px
│   │   ├── template_01.png
│   │   └── template_01.json # Config tọa độ các slot
│   └── sounds/             # Âm thanh beep, shutter
│
├── core/                    # Core logic thuần Python
│   ├── __init__.py
│   ├── camera_service.py   # Wrapper gphoto2, Worker Thread cho Liveview & Capture
│   ├── image_service.py    # Thuật toán Center-crop & Ghép khung bằng Pillow
│   ├── print_service.py    # Silent print bằng win32print
│   └── session_manager.py  # Quản lý vòng đời phiên chụp & file tạm
│
├── api/                     # Web Server FastAPI
│   ├── __init__.py
│   ├── routes.py           # Endpoints HTTP (start, capture, composite, print)
│   └── websocket.py        # WebSocket Handler stream Live-view
│
├── static/                  # Web Frontend (Kiosk UI)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── websocket.js
│
├── tests/                   # Các script PoC độc lập
│   ├── test_camera.py
│   ├── test_composer.py
│   └── test_printer.py
│
├── launch.bat               # Script tự động khởi chạy Server & Chrome Kiosk
├── main.py                  # Entrypoint chạy FastAPI Backend
├── requirements.txt
└── PROJECT_SPEC.md
```

---

## 6. MÃ NGUỒN CỐT LÕI MẪU (CORE POC CODE)

### 6.1. File Cấu Hình Slot Khung Ảnh (`assets/templates/template_01.json`)
```json
{
  "canvas_width": 1200,
  "canvas_height": 1800,
  "slots": [
    {"x": 60, "y": 80, "width": 510, "height": 720},
    {"x": 630, "y": 80, "width": 510, "height": 720},
    {"x": 60, "y": 880, "width": 510, "height": 720},
    {"x": 630, "y": 880, "width": 510, "height": 720}
  ]
}
```

### 6.2. Module Ghép Ảnh Pillow (`core/image_service.py`)
```python
import os
import json
from PIL import Image

class ImageService:
    @staticmethod
    def center_crop_and_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        src_w, src_h = img.size
        target_aspect = target_w / target_h
        src_aspect = src_w / src_h

        if src_aspect > target_aspect:
            new_w = int(src_h * target_aspect)
            offset_x = (src_w - new_w) // 2
            crop_box = (offset_x, 0, offset_x + new_w, src_h)
        else:
            new_h = int(src_w / target_aspect)
            offset_y = (src_h - new_h) // 2
            crop_box = (0, offset_y, src_w, offset_y + new_h)

        cropped = img.crop(crop_box)
        return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    @classmethod
    def compose_photobooth(cls, photo_paths: list[str], config_path: str, template_png_path: str, output_path: str) -> str:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        canvas_w = config["canvas_width"]
        canvas_h = config["canvas_height"]
        canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))

        for i, slot in enumerate(config["slots"]):
            if i >= len(photo_paths):
                break
            with Image.open(photo_paths[i]) as photo:
                photo = photo.convert("RGBA")
                processed_photo = cls.center_crop_and_resize(photo, slot["width"], slot["height"])
                canvas.paste(processed_photo, (slot["x"], slot["y"]))

        if os.path.exists(template_png_path):
            with Image.open(template_png_path) as template:
                template = template.convert("RGBA")
                if template.size != (canvas_w, canvas_h):
                    template = template.resize((canvas_w, canvas_h), Image.Resampling.LANCZOS)
                canvas.paste(template, (0, 0), mask=template)

        final_output = canvas.convert("RGB")
        final_output.save(output_path, "JPEG", quality=95)
        return output_path
```

### 6.3. Script Khởi Chạy Tự Động (`launch.bat`)
```bat
@echo off
title Photobooth Application Launcher

:: Kích hoạt môi trường ảo Python
call venv\Scripts\activate

:: Chạy Backend FastAPI ngầm
start /b uvicorn main:app --host 127.0.0.1 --port 8000

:: Chờ Server ready trong 3 giây
timeout /t 3 /nobreak >nul

:: Khởi chạy Chrome Kiosk Mode
start chrome.exe --kiosk http://127.0.0.1:8000/static/index.html --incognito --disable-pinch --no-first-run
```

---

## 7. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN (IMPLEMENTATION PHASES)
* **Giai đoạn 1:** Chạy các file test độc lập trong `tests/` (`test_camera.py`, `test_composer.py`, `test_printer.py`).
* **Giai đoạn 2:** Dựng Core Backend Engine (FastAPI, Camera Thread, Image Service, Session Manager).
* **Giai đoạn 3:** Dựng Giao diện Frontend Kiosk (HTML/CSS/JS, WebSocket Live-view player, CSS Animation countdown).
* **Giai đoạn 4:** Ghép State Machine kết nối End-to-End toàn bộ ứng dụng.
* **Giai đoạn 5:** Đóng gói bằng PyInstaller, viết file `launch.bat` và cấu hình Windows Task Scheduler tự khởi chạy khi bật máy tính.
* **Giai đoạn 6:** Test sức bền (Stress Test) chạy 100 phiên liên tục.
