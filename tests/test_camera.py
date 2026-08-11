import os
import sys
import time
import subprocess
import cv2

# Cấu hình UTF-8 cho Windows Console output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Đường dẫn tới file gphoto2.exe trong thư mục tools của dự án
GPHOTO2_EXE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tools", "gphoto2.exe"))
HAS_GPHOTO2 = os.path.exists(GPHOTO2_EXE)

def run_gphoto2_cmd(args):
    """Hàm bổ trợ gửi lệnh tới gphoto2.exe"""
    if not HAS_GPHOTO2:
        return False, "", f"Không tìm thấy file {GPHOTO2_EXE}."
        
    cmd = [GPHOTO2_EXE] + args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

# 1. HÀM TEST KẾT NỐI (Check Connection)
def test_1_connect(cam_index=0):
    print("--- [TEST 1] KIỂM TRA KẾT NỐI MÁY ẢNH ---")
    if HAS_GPHOTO2:
        print("[Engine: gphoto2.exe]")
        success, stdout, stderr = run_gphoto2_cmd(["--auto-detect"])
        if success and ("Sony" in stdout or "Camera" in stdout or "PTP" in stdout):
            print("=> Kết quả quét thiết bị USB:")
            print(stdout.strip())
            print("=> RESULT: PASS (Đã tìm thấy máy ảnh!)\n")
            return True
        else:
            print(f"=> RESULT: FAIL (Không tìm thấy máy ảnh hoặc lỗi: {stderr or stdout})\n")
            return False
    else:
        print(f"[Engine: OpenCV Webcam/Camera (Index {cam_index})]")
        cap = cv2.VideoCapture(cam_index)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w, c = frame.shape
                print(f"=> Đã kết nối thành công tới Camera index {cam_index} (Độ phân giải: {w}x{h})")
                print("=> RESULT: PASS (Đã tìm thấy camera!)\n")
                cap.release()
                return True
            else:
                print("=> RESULT: FAIL (Camera kết nối được nhưng không đọc được dữ liệu frame)\n")
                cap.release()
                return False
        else:
            print(f"=> RESULT: FAIL (Không thể mở Camera tại index {cam_index})\n")
            return False

# 2. HÀM TEST LIVE-VIEW (Check Liveview Frame)
def test_2_liveview(cam_index=0):
    print("--- [TEST 2] KIỂM TRA LẤY FRAME LIVE-VIEW ---")
    test_frame = "preview_test.jpg"
    if os.path.exists(test_frame):
        try:
            os.remove(test_frame)
        except Exception:
            pass

    if HAS_GPHOTO2:
        print("[Engine: gphoto2.exe]")
        success, stdout, stderr = run_gphoto2_cmd(["--capture-preview", "--filename", test_frame, "--force-overwrite"])
        if success and os.path.exists(test_frame) and os.path.getsize(test_frame) > 0:
            print(f"=> Đã lấy thành công 1 frame preview: {test_frame} ({os.path.getsize(test_frame)} bytes)")
            print("=> RESULT: PASS (Live-view preview hoạt động tốt!)\n")
            return True
        else:
            print(f"=> RESULT: FAIL (Không lấy được preview frame: {stderr or stdout})\n")
            return False
    else:
        print(f"[Engine: OpenCV (Index {cam_index})]")
        cap = cv2.VideoCapture(cam_index)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                cv2.imwrite(test_frame, frame)
                print(f"=> Đã lấy và lưu thành công 1 frame preview: {test_frame} ({os.path.getsize(test_frame)} bytes)")
                print("=> RESULT: PASS (Live-view preview hoạt động tốt!)\n")
                cap.release()
                return True
            else:
                print("=> RESULT: FAIL (Không thể đọc frame từ camera)\n")
                cap.release()
                return False
        else:
            print(f"=> RESULT: FAIL (Không thể mở camera index {cam_index})\n")
            return False

# 3. HÀM TEST CHỤP 1 TẤM & TẢI VỀ (Single Capture & Download)
def test_3_single_capture(output_path="test_photo.jpg", cam_index=0):
    print("--- [TEST 3] CHỤP 1 ẢNH & TẢI VỀ MÁY TÍNH ---")
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except Exception:
            pass

    print("=> Gửi lệnh chụp và tải file...")
    if HAS_GPHOTO2:
        print("[Engine: gphoto2.exe]")
        success, stdout, stderr = run_gphoto2_cmd(["--capture-image-and-download", "--filename", output_path, "--force-overwrite"])
        if success and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print(f"=> Đã chụp và tải file thành công: {output_path} ({os.path.getsize(output_path)} bytes)")
            print("=> RESULT: PASS (Chụp ảnh đơn hoàn thành!)\n")
            return True
        else:
            print(f"=> RESULT: FAIL (Lỗi chụp ảnh: {stderr or stdout})\n")
            return False
    else:
        print(f"[Engine: OpenCV (Index {cam_index})]")
        cap = cv2.VideoCapture(cam_index)
        if cap.isOpened():
            # Xả vài frame đầu để camera cân bằng ánh sáng
            for _ in range(5):
                cap.read()
            ret, frame = cap.read()
            if ret and frame is not None:
                cv2.imwrite(output_path, frame)
                print(f"=> Đã chụp và lưu file thành công: {output_path} ({os.path.getsize(output_path)} bytes)")
                print("=> RESULT: PASS (Chụp ảnh đơn hoàn thành!)\n")
                cap.release()
                return True
            else:
                print("=> RESULT: FAIL (Lỗi chụp ảnh qua OpenCV)\n")
                cap.release()
                return False
        else:
            print(f"=> RESULT: FAIL (Không thể mở camera index {cam_index})\n")
            return False

# 4. HÀM TEST MÔ PHỎNG 1 LƯỢT PHOTOBOOTH (Full Session 8 Photos)
def test_4_full_photobooth_session(cam_index=0):
    print("--- [TEST 4] MÔ PHỎNG LƯỢT CHỤP PHOTOBOOTH (CHỤP 8 TẤM) ---")
    output_dir = "temp_test_session"
    os.makedirs(output_dir, exist_ok=True)
    
    cap = None if HAS_GPHOTO2 else cv2.VideoCapture(cam_index)
    if not HAS_GPHOTO2 and (cap is None or not cap.isOpened()):
        print(f"=> RESULT: FAIL (Không thể mở camera index {cam_index})\n")
        return False

    for i in range(1, 9):
        print(f"\n[Lượt {i}/8] Đang mô phỏng đếm ngược Live-view...")
        time.sleep(1) # Mô phỏng thời gian đếm ngược 1s
        
        target_file = os.path.join(output_dir, f"photo_{i}.jpg")
        print(f"[Lượt {i}/8] === CHỤP ===")
        
        if HAS_GPHOTO2:
            success, stdout, stderr = run_gphoto2_cmd(["--capture-image-and-download", "--filename", target_file, "--force-overwrite"])
            if success and os.path.exists(target_file):
                print(f"[Lượt {i}/8] Đã lưu: {target_file}")
            else:
                print(f"[Lượt {i}/8] Thất bại: {stderr or stdout}")
                print("=> RESULT: FAIL (Gián đoạn phiên chụp)\n")
                return False
        else:
            ret, frame = cap.read()
            if ret and frame is not None:
                cv2.imwrite(target_file, frame)
                print(f"[Lượt {i}/8] Đã lưu: {target_file}")
            else:
                print(f"[Lượt {i}/8] Lỗi chụp frame từ OpenCV")
                cap.release()
                print("=> RESULT: FAIL (Gián đoạn phiên chụp)\n")
                return False

    if cap:
        cap.release()
            
    print("\n=> RESULT: PASS (Hoàn thành xuất sắc lượt chụp 8 tấm!)\n")
    return True

def scan_cameras():
    print("--- [SCAN] QUÉT TẤT CẢ CAMERA ĐANG KẾT NỐI VỚI MÁY TÍNH ---")
    found = 0
    for idx in range(5):
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w, c = frame.shape
                print(f"  [+] Camera Index {idx}: SẴN SÀNG | Độ phân giải: {w}x{h}")
                found += 1
            else:
                print(f"  [-] Camera Index {idx}: Không đọc được frame")
            cap.release()
    if found == 0:
        print("  [!] Không tìm thấy camera nào kết nối.")
    print("----------------------------------------------------------\n")
    return found

if __name__ == "__main__":
    print("==============================================")
    print("      BẮT ĐẦU BỘ KIỂM THỬ CAMERA PHOTOBOOTH    ")
    if HAS_GPHOTO2:
        print("      (Chế độ: gphoto2.exe - DSLR USB Direct)  ")
    else:
        print("      (Chế độ: OpenCV Camera / Webcam Engine)  ")
    print("==============================================\n")
    
    choice = sys.argv[1] if len(sys.argv) > 1 else "all"
    cam_idx = int(sys.argv[2]) if len(sys.argv) > 2 else 0

    if choice == "scan":
        scan_cameras()
    elif choice == "1":
        test_1_connect(cam_idx)
    elif choice == "2":
        test_2_liveview(cam_idx)
    elif choice == "3":
        test_3_single_capture("test_photo.jpg", cam_idx)
    elif choice == "4":
        test_4_full_photobooth_session(cam_idx)
    elif choice == "all":
        if test_1_connect(cam_idx):
            if test_2_liveview(cam_idx):
                if test_3_single_capture("test_photo.jpg", cam_idx):
                    test_4_full_photobooth_session(cam_idx)
    else:
        print("Lựa chọn không hợp lệ! Hãy dùng:")
        print("  python tests/test_camera.py scan           (Quét tìm index các camera)")
        print("  python tests/test_camera.py [1|2|3|4|all] [cam_index] (Chạy bài test với index camera chọn)")


