import os
import cv2
import time
import threading
import logging
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class CameraService:
    """
    Service quản lý kết nối Camera, stream Live-view thời gian thực qua Thread ngầm 
    và xử lý lệnh chụp lưu file ảnh cho hệ thống Photobooth.
    """
    def __init__(self, camera_index: int = 0, width: int = 1280, height: int = 720):
        """
        Khởi tạo CameraService.
        :param camera_index: Chỉ số cổng camera (Mặc định: 0)
        :param width: Độ phân giải chiều rộng (Mặc định: 1280)
        :param height: Độ phân giải chiều cao (Mặc định: 720)
        """
        self.camera_index = camera_index
        self.width = width
        self.height = height
        
        self.cap = None
        self.is_running = False
        self.latest_frame = None
        self.lock = threading.Lock()
        self.thread = None

        # Tự động khởi động kết nối và Thread đọc Live-view
        self.start()

    def start(self):
        """Khởi động kết nối camera và Thread ngầm đọc khung hình."""
        if self.is_running:
            return

        logger.info(f"[CameraService] Đang kết nối tới Camera index {self.camera_index}...")
        self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW) # DSHOW hỗ trợ tốt trên Windows

        if not self.cap.isOpened():
            # Thử mở lại không dùng DSHOW nếu cổng mặc định bận
            self.cap = cv2.VideoCapture(self.camera_index)

        if self.cap.isOpened():
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.is_running = True
            
            # Khởi tạo Worker Thread chạy song song
            self.thread = threading.Thread(target=self._update_loop, daemon=True)
            self.thread.start()
            logger.info(f"[CameraService] ✅ Đã kết nối camera thành công! Live-view Thread đang chạy.")
        else:
            logger.error(f"[CameraService] ❌ Không thể kết nối tới Camera index {self.camera_index}!")

    def _update_loop(self):
        """Hàm vòng lặp ngầm liên tục đọc khung hình từ Camera (Chạy trong Worker Thread)."""
        while self.is_running and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                with self.lock:
                    self.latest_frame = frame
            else:
                time.sleep(0.01)
            time.sleep(0.03) # Giới hạn khoảng ~30 FPS để tối ưu CPU

    def get_liveview_bytes(self) -> bytes:
        """
        Lấy khung hình Live-view mới nhất được mã hóa dạng byte JPEG 
        dùng để stream qua WebSocket sang Frontend UI.
        """
        with self.lock:
            if self.latest_frame is None:
                # Nếu chưa có frame nào, tạo 1 frame màu tối tạm thời chứa thông báo
                blank_frame = np.zeros((self.height, self.width, 3), np.uint8)
                cv2.putText(blank_frame, "CONNECTING CAMERA...", (self.width // 4, self.height // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                ret, buffer = cv2.imencode('.jpg', blank_frame)
                return buffer.tobytes()
            
            # Mã hóa frame hiện tại sang dạng JPG chất lượng 80% (tối ưu tốc độ truyền WebSocket)
            ret, buffer = cv2.imencode('.jpg', self.latest_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret:
                return buffer.tobytes()
            return b""

    def capture_photo(self, output_path: str) -> bool:
        """
        Chụp bức ảnh hiện tại từ Camera và lưu thành file .jpg chất lượng cao.
        :param output_path: Đường dẫn file cần lưu (VD: 'temp/session_xxx/photo_1.jpg')
        :return: True nếu lưu thành công, False nếu thất bại
        """
        with self.lock:
            if self.latest_frame is None:
                logger.error("[CameraService] Không có khung hình nào từ camera để chụp!")
                return False
            
            frame_to_save = self.latest_frame.copy()

        try:
            # Tạo thư mục chứa nếu chưa có
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            # Lưu file ảnh JPEG chất lượng cao 95%
            success = cv2.imwrite(output_path, frame_to_save, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            if success:
                logger.info(f"[CameraService] 📸 Đã chụp và lưu ảnh thành công: {output_path}")
                return True
            else:
                logger.error(f"[CameraService] Lỗi khi ghi file ảnh ra: {output_path}")
                return False
        except Exception as e:
            logger.error(f"[CameraService] Lỗi ngoại lệ khi chụp ảnh: {e}")
            return False

    def release(self):
        """Giải phóng camera và tắt Thread an toàn."""
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        
        if self.cap and self.cap.isOpened():
            self.cap.release()
            logger.info("[CameraService] Đã giải phóng camera an toàn.")


if __name__ == "__main__":
    print("=== TEST MODULE CAMERA SERVICE ===")
    cam_service = CameraService(camera_index=0)
    
    # Cho thread chạy 2 giây
    time.sleep(2)
    
    # Thử lấy 1 byte frame liveview
    frame_bytes = cam_service.get_liveview_bytes()
    print(f"Kích thước frame Liveview byte: {len(frame_bytes)} bytes")
    
    # Thử chụp 1 tấm ảnh test
    test_out = os.path.join("exports", "test_camera_service_photo.jpg")
    if cam_service.capture_photo(test_out):
        print(f"✅ Đã chụp thử thành công tại: {test_out}")
    else:
        print("❌ Chụp ảnh thất bại!")
        
    cam_service.release()
