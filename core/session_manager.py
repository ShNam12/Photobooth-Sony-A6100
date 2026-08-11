import os
import shutil
import time
import uuid
import logging
from datetime import datetime
from pathlib import Path

# Cấu hình log để dễ theo dõi hoạt động hệ thống
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class SessionManager:
    """
    Quản lý vòng đời của một lượt chụp (Session) trong Photobooth.
    Đảm nhận việc tạo thư mục tạm, đường dẫn lưu ảnh và dọn dẹp bộ nhớ.
    """
    def __init__(self, base_temp_dir: str = "temp", base_export_dir: str = "exports"):
        """
        Khởi tạo SessionManager.
        :param base_temp_dir: Thư mục chứa tất cả các session tạm (Mặc định: 'temp')
        :param base_export_dir: Thư mục chứa ảnh ghép thành phẩm (Mặc định: 'exports')
        """
        self.base_temp_dir = Path(base_temp_dir)
        self.base_export_dir = Path(base_export_dir)
        
        # Tự động tạo các thư mục gốc nếu chưa tồn tại
        self.base_temp_dir.mkdir(parents=True, exist_ok=True)
        self.base_export_dir.mkdir(parents=True, exist_ok=True)

    def create_session(self) -> str:
        """
        Khởi tạo một session chụp ảnh mới.
        :return: Mã session_id độc nhất (str)
        """
        # Tạo session_id theo thời gian + 4 ký tự ngẫu nhiên
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_suffix = str(uuid.uuid4())[:4]
        session_id = f"session_{timestamp}_{random_suffix}"

        # Tạo thư mục riêng cho session trong temp/
        session_dir = self.get_session_dir(session_id)
        session_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"[SessionManager] Đã khởi tạo session mới: {session_id}")
        return session_id

    def get_session_dir(self, session_id: str) -> Path:
        """
        Lấy đường dẫn thư mục làm việc của một session.
        :param session_id: Mã định danh phiên chụp
        :return: Đối tượng Path trỏ tới thư mục temp/session_id
        """
        return self.base_temp_dir / session_id

    def get_photo_path(self, session_id: str, photo_index: int) -> str:
        """
        Tạo đường dẫn file ảnh chụp từng lượt (photo_1.jpg, photo_2.jpg...).
        :param session_id: Mã session
        :param photo_index: Thứ tự ảnh (1 đến 8)
        :return: Đường dẫn dạng chuỗi (str)
        """
        session_dir = self.get_session_dir(session_id)
        photo_name = f"photo_{photo_index}.jpg"
        return str(session_dir / photo_name)

    def get_captured_photos(self, session_id: str) -> list[str]:
        """
        Lấy danh sách đường dẫn tất cả các ảnh đã chụp có trong session.
        :param session_id: Mã session
        :return: Danh sách các đường dẫn file ảnh jpg (list[str])
        """
        session_dir = self.get_session_dir(session_id)
        if not session_dir.exists():
            return []
        
        # Tìm tất cả các file .jpg có trong thư mục session
        photos = sorted(list(session_dir.glob("photo_*.jpg")))
        return [str(p) for p in photos]

    def get_export_path(self, session_id: str) -> str:
        """
        Tạo đường dẫn cho file ảnh ghép thành phẩm cuối cùng trong thư mục exports/.
        :param session_id: Mã session
        :return: Đường dẫn file ảnh final .jpg
        """
        export_name = f"{session_id}_final.jpg"
        return str(self.base_export_dir / export_name)

    def cleanup_session(self, session_id: str) -> bool:
        """
        Xóa sạch thư mục tạm của một session sau khi hoàn tất lượt chụp.
        :param session_id: Mã session cần xóa
        :return: True nếu xóa thành công, False nếu thất bại
        """
        session_dir = self.get_session_dir(session_id)
        if session_dir.exists():
            try:
                shutil.rmtree(session_dir)
                logger.info(f"[SessionManager] Đã dọn dẹp thư mục rác session: {session_id}")
                return True
            except Exception as e:
                logger.error(f"[SessionManager] Lỗi dọn dẹp session {session_id}: {e}")
                return False
        return True

    def cleanup_old_sessions(self, max_age_seconds: int = 3600):
        """
        Quét và xóa tự động các thư mục session tạm đã tồn tại quá lâu (ví dụ > 1 giờ).
        Giúp tránh trường hợp khách bỏ ngang làm rác ổ cứng.
        :param max_age_seconds: Thời gian tối đa tồn tại (tính bằng giây, mặc định 3600s = 1h)
        """
        now = time.time()
        for item in self.base_temp_dir.iterdir():
            if item.is_dir() and item.name.startswith("session_"):
                # Kiểm tra thời gian sửa đổi gần nhất của thư mục
                folder_age = now - item.stat().st_mtime
                if folder_age > max_age_seconds:
                    try:
                        shutil.rmtree(item)
                        logger.info(f"[SessionManager] Đã dọn dẹp tự động session cũ hết hạn: {item.name}")
                    except Exception as e:
                        logger.error(f"[SessionManager] Không thể xóa session cũ {item.name}: {e}")
if __name__ == "__main__":
    # Test thử các tính năng của SessionManager
    sm = SessionManager()
    
    # 1. Tạo session
    sid = sm.create_session()
    print("Session ID vừa tạo:", sid)
    
    # 2. Thử lấy đường dẫn chụp ảnh lượt 1
    photo1 = sm.get_photo_path(sid, 1)
    print("Đường dẫn photo 1:", photo1)
    
    # 3. Giả lập tạo 1 file ảnh rỗng
    with open(photo1, "w") as f:
        f.write("test")
        
    print("Danh sách ảnh đang có:", sm.get_captured_photos(sid))
    
    # 4. Thử dọn dẹp session
    sm.cleanup_session(sid)
    print("Đã dọn dẹp xong!")
