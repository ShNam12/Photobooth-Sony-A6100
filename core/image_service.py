import os
import json
import logging
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class ImageService:
    """
    Module xử lý hình ảnh: Cắt ảnh thông minh (Center-crop) 
    và ghép 4 ảnh vào khung mẫu canvas 1200x1800 px chuẩn in photobooth.
    """

    @staticmethod
    def center_crop_and_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        """
        Cắt ảnh từ chính giữa (Center-Crop) theo tỷ lệ của khung mục tiêu,
        giúp giữ khuôn mặt ở trung tâm mà không làm méo/co giãn ảnh.
        """
        src_w, src_h = img.size
        target_aspect = target_w / target_h
        src_aspect = src_w / src_h

        if src_aspect > target_aspect:
            # Ảnh rộng hơn khung -> Cắt bớt 2 bên trái/phải
            new_w = int(src_h * target_aspect)
            offset_x = (src_w - new_w) // 2
            crop_box = (offset_x, 0, offset_x + new_w, src_h)
        else:
            # Ảnh cao hơn khung -> Cắt bớt 2 đầu trên/dưới
            new_h = int(src_w / target_aspect)
            offset_y = (src_h - new_h) // 2
            crop_box = (0, offset_y, src_w, offset_y + new_h)

        cropped = img.crop(crop_box)
        # Resize về kích thước chuẩn của slot với thuật toán làm mịn LANCZOS
        return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    @classmethod
    def compose_photobooth(
        cls, 
        photo_paths: list[str], 
        config_path: str, 
        template_png_path: str, 
        output_path: str
    ) -> str:
        """
        Tự động ghép danh sách 4 ảnh vào canvas theo tọa độ file config JSON.
        Đè khung mẫu PNG lên trên cùng và xuất ra file final JPEG.
        
        :param photo_paths: Danh sách 4 đường dẫn ảnh được chọn
        :param config_path: Đường dẫn file template_01.json
        :param template_png_path: Đường dẫn file khung PNG trong suốt
        :param output_path: Đường dẫn file xuất thành phẩm final.jpg
        :return: Đường dẫn file thành phẩm (str)
        """
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Không tìm thấy file cấu hình template: {config_path}")

        # 1. Đọc file cấu hình tọa độ slots
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        canvas_w = config.get("canvas_width", 1200)
        canvas_h = config.get("canvas_height", 1800)
        slots = config.get("slots", [])

        # 2. Khởi tạo Canvas nền trắng RGBA
        canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))

        # 3. Lần lượt Crop & Dán từng ảnh vào ô slot tương ứng
        for i, slot in enumerate(slots):
            if i >= len(photo_paths):
                break
            
            photo_path = photo_paths[i]
            if os.path.exists(photo_path):
                try:
                    with Image.open(photo_path) as photo:
                        photo = photo.convert("RGBA")
                        processed_photo = cls.center_crop_and_resize(photo, slot["width"], slot["height"])
                        canvas.paste(processed_photo, (slot["x"], slot["y"]))
                        logger.info(f"[ImageService] Đã dán ảnh {i+1} vào slot ({slot['x']}, {slot['y']})")
                except Exception as e:
                    logger.error(f"[ImageService] Lỗi khi xử lý ảnh {photo_path}: {e}")

        # 4. Phủ khung mẫu PNG (nếu tồn tại) lên trên bề mặt Canvas
        if os.path.exists(template_png_path):
            try:
                with Image.open(template_png_path) as template:
                    template = template.convert("RGBA")
                    if template.size != (canvas_w, canvas_h):
                        template = template.resize((canvas_w, canvas_h), Image.Resampling.LANCZOS)
                    # Sử dụng chính tấm ảnh làm mask để giữ nguyên độ trong suốt (Alpha channel)
                    canvas.paste(template, (0, 0), mask=template)
                    logger.info("[ImageService] Đã phủ khung template PNG thành công!")
            except Exception as e:
                logger.error(f"[ImageService] Lỗi khi đè khung PNG: {e}")
        else:
            logger.warning(f"[ImageService] Không tìm thấy file khung PNG: {template_png_path}. Sẽ xuất ảnh ghép không có khung đè.")

        # 5. Chuyển sang kênh màu RGB và xuất file JPEG chất lượng cao 95%
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        final_output = canvas.convert("RGB")
        final_output.save(output_path, "JPEG", quality=95)
        logger.info(f"[ImageService] Đã xuất file thành phẩm thành công: {output_path}")
        return output_path


if __name__ == "__main__":
    # Test thử tính năng ghép ảnh của ImageService bằng các ảnh mẫu trong tests/temp_test_session
    print("=== TEST MODULE IMAGE SERVICE ===")
    
    # Lấy 4 ảnh mẫu vừa test camera trước đó
    test_photos = [
        os.path.join("tests", "temp_test_session", f"photo_{i}.jpg") 
        for i in range(1, 5)
    ]
    
    config_file = os.path.join("assets", "templates", "template_01.json")
    template_png = os.path.join("assets", "templates", "template_01.png")
    out_file = os.path.join("exports", "test_composite_final.jpg")
    
    # Kiểm tra xem có đủ ảnh test không
    if all(os.path.exists(p) for p in test_photos):
        res = ImageService.compose_photobooth(test_photos, config_file, template_png, out_file)
        print(f"✅ Đã tạo thành công ảnh ghép test tại: {res}")
    else:
        print("⚠️ Thiếu 4 ảnh test trong tests/temp_test_session/. Vui lòng đảm bảo các file photo_1..4.jpg tồn tại.")
