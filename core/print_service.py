import os
import sys
import logging

# Kiểm tra sự có mặt của thư viện win32print (có sẵn trên Windows khi cài pywin32)
try:
    import win32print
    import win32ui
    from PIL import Image, ImageWin
    HAS_WIN32PRINT = True
except ImportError:
    HAS_WIN32PRINT = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class PrintService:
    """
    Module quản lý in ấn bức ảnh thành phẩm ra máy in chuyên dụng 
    thông qua Windows Spooler bằng cơ chế Silent Print.
    """
    def __init__(self, default_printer_name: str = None):
        self.default_printer_name = default_printer_name

    @staticmethod
    def list_printers() -> list[str]:
        """Liệt kê tất cả các máy in sẵn có trên hệ thống Windows."""
        if not HAS_WIN32PRINT:
            logger.warning("[PrintService] Thư viện win32print chưa sẵn sàng. Đang ở chế độ Giả Lập In.")
            return ["Virtual Printer (Simulation)"]
        
        try:
            # Lấy danh sách máy in cục bộ và máy in mạng trên Windows
            printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
            return [p[2] for p in printers]
        except Exception as e:
            logger.error(f"[PrintService] Lỗi khi lấy danh sách máy in: {e}")
            return []

    @staticmethod
    def get_default_printer() -> str:
        """Lấy tên máy in mặc định của hệ thống Windows."""
        if not HAS_WIN32PRINT:
            return "Virtual Printer (Simulation)"
        try:
            return win32print.GetDefaultPrinter()
        except Exception as e:
            logger.error(f"[PrintService] Lỗi khi lấy máy in mặc định: {e}")
            return ""

    def print_image(self, image_path: str, printer_name: str = None) -> bool:
        """
        In bức ảnh thành phẩm ra máy in được chỉ định hoặc máy in mặc định.
        :param image_path: Đường dẫn tới file ảnh thành phẩm JPEG (1200x1800 px)
        :param printer_name: Tên máy in (Nếu để None sẽ tự động dùng máy in mặc định)
        :return: True nếu gửi lệnh in thành công, False nếu thất bại
        """
        if not os.path.exists(image_path):
            logger.error(f"[PrintService] File ảnh cần in không tồn tại: {image_path}")
            return False

        target_printer = printer_name or self.default_printer_name or self.get_default_printer()

        if not HAS_WIN32PRINT or not target_printer:
            logger.info(f"[PrintService] 🖨️ [MÔ PHỎNG IN] Đã nhận lệnh in file '{image_path}' tới máy in '{target_printer}' (Giả lập in thành công).")
            return True

        try:
            logger.info(f"[PrintService] 🖨️ Đang gửi lệnh in file '{image_path}' tới máy in '{target_printer}'...")
            
            # Đọc ảnh và gửi tới Windows Graphics Device Interface (GDI)
            hDC = win32ui.CreateDC()
            hDC.CreatePrinterDC(target_printer)
            
            # Khởi động Document in
            hDC.StartDoc(image_path)
            hDC.StartPage()
            
            # Mở ảnh bằng Pillow
            with Image.open(image_path) as img:
                dib = ImageWin.Dib(img)
                # Lấy chiều rộng & chiều cao vùng in được của máy in
                printable_w = hDC.GetDeviceCaps(110) # HORZRES
                printable_h = hDC.GetDeviceCaps(111) # VERTRES
                # Đưa toàn bộ bức ảnh lên thiết bị in
                printable_area = (0, 0, printable_w, printable_h)
                dib.draw(hDC.GetHandleOutput(), printable_area)
                
            hDC.EndPage()
            hDC.EndDoc()
            hDC.DeleteDC()
            
            logger.info(f"[PrintService] ✅ Đã gửi lệnh in thành công tới Windows Spooler cho máy in '{target_printer}'!")
            return True
        except Exception as e:
            logger.error(f"[PrintService] Lỗi khi gửi lệnh in qua win32ui: {e}. Thử phương án fallback ShellExecute...")
            try:
                # Phương án dự phòng bằng Windows ShellExecute
                win32api = __import__("win32api")
                win32api.ShellExecute(0, "printto", image_path, f'"{target_printer}"', ".", 0)
                logger.info(f"[PrintService] ✅ Đã gửi lệnh in thành công (Fallback ShellExecute) tới máy in '{target_printer}'!")
                return True
            except Exception as ex:
                logger.error(f"[PrintService] Lỗi fallback in ấn thất bại: {ex}")
                return False


if __name__ == "__main__":
    print("=== TEST MODULE PRINT SERVICE ===")
    ps = PrintService()
    
    # 1. Kiểm tra danh sách máy in
    printers = ps.list_printers()
    print("Danh sách máy in có trong máy tính:", printers)
    print("Máy in mặc định hiện tại:", ps.get_default_printer())
    
    # 2. Test thử gửi lệnh in bức ảnh test_composite_final.jpg vừa xuất từ image_service.py
    test_img = os.path.join("exports", "test_composite_final.jpg")
    if os.path.exists(test_img):
        success = ps.print_image(test_img)
        print("Kết quả gửi lệnh in:", "THÀNH CÔNG" if success else "THẤT BẠI")
    else:
        print("⚠️ Chưa có file test_composite_final.jpg trong exports/. Vui lòng đảm bảo file tồn tại.")
