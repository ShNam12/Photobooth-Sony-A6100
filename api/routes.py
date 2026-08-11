import os
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.session_manager import SessionManager
from core.image_service import ImageService
from core.print_service import PrintService
from core.camera_service import CameraService

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Khởi tạo các instance dịch vụ dùng chung
session_mgr = SessionManager()
print_svc = PrintService()
camera_svc_instance: CameraService = None

def set_camera_service_for_routes(service: CameraService):
    """Gán instance CameraService dùng chung từ main.py."""
    global camera_svc_instance
    camera_svc_instance = service


# --- PYDANTIC MODELS (Định nghĩa kiểu dữ liệu truyền nhận Request/Response) ---

class CaptureRequest(BaseModel):
    session_id: str
    photo_index: int  # Từ 1 đến 8

class CompositeRequest(BaseModel):
    session_id: str
    selected_photos: List[str]  # Danh sách 4 đường dẫn ảnh do người dùng chọn từ 8 tấm
    template_name: Optional[str] = "template_01"

class PrintRequest(BaseModel):
    image_path: str
    printer_name: Optional[str] = None

class EndSessionRequest(BaseModel):
    session_id: str


# --- REST API ENDPOINTS ---

@router.post("/start-session")
def start_session():
    """Tạo một phiên chụp ảnh mới và trả về session_id."""
    session_id = session_mgr.create_session()
    return {
        "success": True,
        "session_id": session_id,
        "message": "Đã khởi tạo phiên chụp thành công."
    }

@router.post("/capture")
def capture_photo(req: CaptureRequest):
    """Gửi lệnh chụp 1 tấm ảnh cho session hiện tại."""
    if not camera_svc_instance or not camera_svc_instance.is_running:
        raise HTTPException(status_code=500, detail="CameraService chưa được khởi tạo hoặc chưa sẵn sàng!")

    save_path = session_mgr.get_photo_path(req.session_id, req.photo_index)
    success = camera_svc_instance.capture_photo(save_path)
    
    if success:
        return {
            "success": True,
            "session_id": req.session_id,
            "photo_index": req.photo_index,
            "photo_path": save_path,
            "photo_url": f"/temp/{req.session_id}/photo_{req.photo_index}.jpg"
        }
    else:
        raise HTTPException(status_code=500, detail="Không thể chụp ảnh từ Camera!")

@router.get("/session-photos/{session_id}")
def get_session_photos(session_id: str):
    """Lấy danh sách đường dẫn tất cả các ảnh đã chụp trong phiên (cho màn hình chọn 4/8 ảnh)."""
    photos = session_mgr.get_captured_photos(session_id)
    photo_urls = [
        f"/temp/{session_id}/{os.path.basename(p)}" 
        for p in photos
    ]
    return {
        "success": True,
        "session_id": session_id,
        "photos": photos,
        "photo_urls": photo_urls
    }

@router.post("/composite")
def composite_photo(req: CompositeRequest):
    """Nhận 4 ảnh người dùng chọn, cắt ghép thành file ảnh thành phẩm 1200x1800 px."""
    if len(req.selected_photos) == 0:
        raise HTTPException(status_code=400, detail="Danh sách ảnh chọn không được rỗng!")

    config_path = os.path.join("assets", "templates", f"{req.template_name}.json")
    template_png = os.path.join("assets", "templates", f"{req.template_name}.png")
    output_path = session_mgr.get_export_path(req.session_id)

    try:
        final_path = ImageService.compose_photobooth(
            photo_paths=req.selected_photos,
            config_path=config_path,
            template_png_path=template_png,
            output_path=output_path
        )
        return {
            "success": True,
            "session_id": req.session_id,
            "final_path": final_path,
            "final_url": f"/exports/{os.path.basename(final_path)}"
        }
    except Exception as e:
        logger.error(f"[API] Lỗi ghép ảnh: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi ghép ảnh: {str(e)}")

@router.post("/print")
def print_final_photo(req: PrintRequest):
    """Gửi lệnh in im lặng file ảnh thành phẩm ra máy in."""
    success = print_svc.print_image(req.image_path, req.printer_name)
    if success:
        return {"success": True, "message": "Đã gửi lệnh in thành công."}
    else:
        raise HTTPException(status_code=500, detail="Gửi lệnh in thất bại!")

@router.post("/end-session")
def end_session(req: EndSessionRequest):
    """Kết thúc phiên và dọn dẹp thư mục tạm."""
    success = session_mgr.cleanup_session(req.session_id)
    return {
        "success": success,
        "session_id": req.session_id,
        "message": "Đã dọn dẹp phiên chụp."
    }
