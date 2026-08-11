import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.camera_service import CameraService
from api.routes import router as api_router, set_camera_service_for_routes
from api.websocket import router as ws_router, set_camera_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Quản lý vòng đời khởi động/tắt máy Server và tự động giải phóng Camera
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Main] Đang khởi động Server & CameraService...")
    camera_svc = CameraService(camera_index=0)
    
    # Gán camera_svc tới các Router
    set_camera_service_for_routes(camera_svc)
    set_camera_service(camera_svc)
    
    yield  # Server đang hoạt động
    
    logger.info("[Main] Đang dừng Server & Giải phóng Camera...")
    camera_svc.release()

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="Photobooth Standalone System API",
    description="Backend API điều khiển Camera Sony A6100, ghép ảnh và in tự động.",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS cho phép gọi API thoải mái từ Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đảm bảo các thư mục tĩnh sẵn sàng
for folder in ["static", "temp", "exports", "assets"]:
    os.makedirs(folder, exist_ok=True)

# Mount các thư mục tài nguyên tĩnh
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/temp", StaticFiles(directory="temp"), name="temp")
app.mount("/exports", StaticFiles(directory="exports"), name="exports")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Đăng ký REST API và WebSocket Routers
app.include_router(api_router)
app.include_router(ws_router)

if __name__ == "__main__":
    import uvicorn
    # Khởi chạy Uvicorn Server tại 127.0.0.1:8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
