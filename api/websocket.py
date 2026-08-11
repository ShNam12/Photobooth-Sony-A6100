import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.camera_service import CameraService

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter()

# Biến toàn cục chứa instance của CameraService (sẽ được gán từ main.py)
camera_service_instance: CameraService = None

def set_camera_service(service: CameraService):
    """Gán instance CameraService dùng chung cho WebSocket."""
    global camera_service_instance
    camera_service_instance = service

@router.websocket("/ws/liveview")
async def websocket_liveview(websocket: WebSocket):
    """
    WebSocket Endpoint: Stream liên tục dòng dữ liệu hình ảnh JPEG 
    từ máy ảnh sang Frontend Kiosk UI để hiển thị Live-view.
    """
    await websocket.accept()
    logger.info("[WebSocket] Client Frontend đã kết nối tới kênh Live-view.")

    try:
        while True:
            if camera_service_instance and camera_service_instance.is_running:
                # Lấy khung hình mới nhất ở dạng chuỗi Bytes JPEG
                frame_bytes = camera_service_instance.get_liveview_bytes()
                if frame_bytes:
                    # Gửi gói tin nhị phân (Binary) tới màn hình Kiosk
                    await websocket.send_bytes(frame_bytes)
            
            # Tốc độ phát khoảng 30 FPS (~0.033 giây mỗi frame)
            await asyncio.sleep(0.033)
            
    except WebSocketDisconnect:
        logger.info("[WebSocket] Client Frontend đã ngắt kết nối Live-view.")
    except Exception as e:
        logger.error(f"[WebSocket] Lỗi kết nối WebSocket Live-view: {e}")
