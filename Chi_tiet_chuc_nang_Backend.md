# CHI TIẾT CHỨC NĂNG HỆ THỐNG CORE BACKEND (PHOTOBOOTH STANDALONE)

Tài liệu này giải thích chi tiết nguyên lý vận hành, kịch bản làm việc và nhiệm vụ của các module lõi (Core Engine) thuộc Backend hệ thống Photobooth. Tài liệu được viết theo phương pháp ẩn dụ thực tế giúp cả người dùng không thuộc lĩnh vực công nghệ cũng có thể hiểu rõ.

---

## 1. MÔ HÌNH TỔNG QUAN: "STUDIO CHỤP ẢNH TỰ ĐỘNG THU NHỎ"

Hệ thống Core Backend đóng vai trò như một **Studio chụp ảnh tự động thu nhỏ**, bao gồm **4 nhân viên chuyên trách** (tương ứng với 4 module Python trong thư mục `core/`) phối hợp làm việc nhịp nhàng:

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      STUDIO CHỤP ẢNH PHOTOBOOTH                             │
 │                                                                             │
 │ ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────────┐ │
 │ │  session_manager │   │  camera_service  │   │       image_service       │ │
 │ │  (Lễ Tân Quản Lý)│   │  (Nhiếp Ảnh Gia) │   │ (Kỹ Thuật Viên Photoshop) │ │
 │ └────────┬─────────┘   └────────┬─────────┘   └─────────────┬─────────────┘ │
 │          │                      │                           │               │
 │          └──────────────────────┼───────────────────────────┘               │
 │                                 ▼                                           │
 │                       ┌───────────────────┐                                 │
 │                       │   print_service   │                                 │
 │                       │ (Nhân Viên Máy In)│                                 │
 │                       └───────────────────┘                                 │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG MODULE LÕI (CORE MODULES)

### 2.1. `core/session_manager.py` — "Quản Lý Lượt Chụp (Lễ Tân)"
* **Nhiệm vụ:** Tiếp đón từng lượt khách, cấp mã số vé độc nhất (`session_id`) và mở một **"Tủ hồ sơ riêng"** (thư mục tạm `/temp/{session_id}/`) cho lượt khách đó.
* **Kịch bản làm việc chi tiết:**
  1. **Khởi tạo phiên (`create_session`):** Khi khách chạm vào màn hình bấm "BẮT ĐẦU CHỤP", Lễ tân tạo một thư mục tạm mới được đặt tên theo thời gian thực (Ví dụ: `temp/20260810_153000/`).
  2. **Quản lý lưu trữ ảnh (`save_photo`):** Mỗi khi camera chụp xong 1 tấm, Lễ tân sẽ lấy tấm ảnh đó đánh số thứ tự `photo_1.jpg`, `photo_2.jpg`... cho tới `photo_8.jpg` rồi cất gọn gàng vào tủ hồ sơ tạm.
  3. **Dọn dẹp tự động (`cleanup_session`):** Sau khi khách đã in ảnh hoàn tất và nhận quà (hoặc sau khi bỏ dở lượt chụp quá 60 giây timeout), Lễ tân tự động xóa sạch toàn bộ ảnh tạm trong tủ hồ sơ để ổ cứng máy tính không bị đầy rác.

---

### 2.2. `core/camera_service.py` — "Nhiếp Ảnh Gia & Camera"
* **Nhiệm vụ:** Nhìn qua ống kính máy ảnh Sony A6100 để "chiếu trực tiếp" lên màn hình cho khách soi gương tạo dáng (Live-view), đồng thời bấm sập khẩu chụp ảnh sắc nét khi đếm ngược về 0.
* **Kịch bản làm việc chi tiết:**
  1. **Xem trước trực tiếp (`get_liveview_bytes`):** Giống như một người quay phim, module này sử dụng một luồng xử lý riêng (Worker Thread) liên tục truyền 24–30 khung hình/giây từ camera lên màn hình cảm ứng. Khách đứng trước máy sẽ nhìn thấy chính mình ở thời gian thực để tạo dáng.
  2. **Bấm máy chụp (`capture_photo`):** Khi đồng hồ đếm ngược trên màn hình về 0, Nhiếp ảnh gia gửi lệnh bắt máy ảnh Sony "sập khẩu", bắt trọn khoảnh khắc ở độ phân giải cao nhất và tải file ảnh chất lượng cao về máy tính.

---

### 2.3. `core/image_service.py` — "Kỹ Thuật Viên Photoshop Tự Động"
* **Nhiệm vụ:** Lấy 4 bức ảnh khách chọn trong số 8 bức đã chụp, cắt tỉa vừa vặn theo ô, dán chiếc "Khung sự kiện (Template PNG)" chứa logo/hoa văn lên trên cùng để ra bức ảnh thành phẩm hoàn chỉnh.
* **Kịch bản làm việc chi tiết:**
  1. **Cắt ảnh thông minh (`center_crop_and_resize`):** Ảnh gốc từ máy ảnh có tỷ lệ riêng, nhưng ô khung lại là hình chữ nhật chuẩn. Kỹ thuật viên tự động căn lấy khu vực trung tâm (khu khuôn mặt), cắt bỏ phần thừa hai bên để ảnh khi ghép không bị móp méo hay biến hình.
  2. **Đặt ảnh vào vị trí (`compose_photobooth`):** Dựa theo file bản vẽ thiết kế (`template_01.json`), Kỹ thuật viên dán 4 ảnh lần lượt vào 4 ô tương ứng trên tờ giấy canvas kích thước **1200 x 1800 pixels** (chuẩn in 300 DPI khổ 10x15 cm).
  3. **Phủ khung & xuất file:** Đè chiếc khung PNG trong suốt lên trên cùng. Xuất ra 1 tệp ảnh thành phẩm chất lượng cao sẵn sàng để in.

---

### 2.4. `core/print_service.py` — "Nhân Viên Vận Hành Máy In"
* **Nhiệm vụ:** Nhận tệp ảnh thành phẩm từ Kỹ thuật viên và đẩy thẳng ra máy in nhiệt chuyên dụng bằng cơ chế **Silent Print** (In im lặng - không xuất hiện bảng chọn Windows làm phiền người dùng).
* **Kịch bản làm việc chi tiết:**
  1. Kiểm tra kết nối tới máy in nhiệt (DNP DS-RX1HS / Canon Selphy) qua cổng USB máy tính.
  2. Nạp ảnh thành phẩm vào dịch vụ in của Windows (`win32print`).
  3. Máy in tự động cuộn giấy, phun màu sắc nét và cắt nhả tờ ảnh khổ 4x6 inch (10x15 cm) ra khay cho khách hàng cầm về.

---

### 2.5. File `assets/templates/template_01.json` — "Bản Vẽ Kỹ Thuật Tọa Độ"
Đây là file cấu hình dạng JSON đóng vai trò như **Bản vẽ thiết kế** quy định vị trí cho Kỹ thuật viên Photoshop (`image_service.py`):
* **`canvas_width` & `canvas_height`:** 1200 x 1800 pixels (Tương ứng tổng kích thước tờ ảnh 4x6 inch ở chuẩn in 300 DPI).
* **`slots`:** Danh sách 4 vị trí ô ảnh gồm tọa độ x, y, chiều rộng và chiều cao của từng ô.

---

## 3. KỊCH BẢN TỔNG THỂ KHI KHÁCH SỬ DỤNG MÁY (END-TO-END WORKFLOW)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Khách chạm màn hình chọn Khung ──> session_manager khởi tạo Session ID mới     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 2: Soi gương & Chụp 8 ảnh ──────────> camera_service truyền Live-view real-time,   │
│                                            sau đó chụp 8 tấm lưu vào thư mục tạm       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 3: Khách chạm chọn 4 ảnh ───────────> image_service đọc tọa độ template_01.json,  │
│                                            cắt crop 4 ảnh & dán khung đè lên           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 4: Khách xem lại & Bấm IN ──────────> print_service đẩy lệnh Silent Print ra máy  │
│                                            in, nhả ảnh ra khay                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 5: Kết thúc lượt chụp ──────────────> session_manager dọn dẹp ảnh tạm & reset về  │
│                                            trạng thái chờ sẵn sàng đón khách mới       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
