/**
 * Dịch vụ API trung gian giao tiếp giữa Frontend React Kiosk 
 * và Backend FastAPI Python Server (127.0.0.1:8000).
 */

const BASE_URL = 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;
const WS_URL = 'ws://127.0.0.1:8000/ws/liveview';

export interface StartSessionResponse {
    success: boolean;
    session_id: string;
    message: string;
}

export interface CaptureResponse {
    success: boolean;
    session_id: string;
    photo_index: number;
    photo_path: string;
    photo_url: string;
}

export interface SessionPhotosResponse {
    success: boolean;
    session_id: string;
    photos: string[];
    photo_urls: string[];
}

export interface CompositeResponse {
    success: boolean;
    session_id: string;
    final_path: string;
    final_url: string;
}

export interface PrintResponse {
    success: boolean;
    message: string;
}

// --- REST API CALLS ---

/**
 * Khởi tạo lượt chụp mới (Tạo session_id trên Backend)
 */
export async function startSession(): Promise<StartSessionResponse> {
    const response = await fetch(`${API_URL}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error('Không thể khởi tạo session mới từ Backend!');
    }
    return response.json();
}

/**
 * Gửi lệnh chụp 1 tấm ảnh cho máy ảnh Sony A6100
 */
export async function capturePhoto(sessionId: string, photoIndex: number): Promise<CaptureResponse> {
    const response = await fetch(`${API_URL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            photo_index: photoIndex,
        }),
    });
    if (!response.ok) {
        throw new Error(`Lỗi chụp tấm ảnh số ${photoIndex}!`);
    }
    return response.json();
}

/**
 * Lấy danh sách đường dẫn tất cả các ảnh đã chụp trong phiên hiện tại
 */
export async function getSessionPhotos(sessionId: string): Promise<SessionPhotosResponse> {
    const response = await fetch(`${API_URL}/session-photos/${sessionId}`);
    if (!response.ok) {
        throw new Error('Không thể lấy danh sách ảnh đã chụp!');
    }
    return response.json();
}

/**
 * Gửi 4 đường dẫn ảnh người dùng chọn lên Backend để cắt ghép vào khung mẫu (1200x1800 px)
 */
export async function compositePhotos(
    sessionId: string,
    selectedPhotos: string[],
    templateName: string = 'template_01'
): Promise<CompositeResponse> {
    const response = await fetch(`${API_URL}/composite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            selected_photos: selectedPhotos,
            template_name: templateName,
        }),
    });
    if (!response.ok) {
        throw new Error('Lỗi khi thực hiện ghép khung ảnh!');
    }
    return response.json();
}

/**
 * Gửi lệnh in im lặng file ảnh thành phẩm ra máy in nhiệt
 */
export async function printPhoto(imagePath: string, printerName?: string): Promise<PrintResponse> {
    const response = await fetch(`${API_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            image_path: imagePath,
            printer_name: printerName || null,
        }),
    });
    if (!response.ok) {
        throw new Error('Lỗi khi gửi lệnh in ấn!');
    }
    return response.json();
}

/**
 * Dọn dẹp thư mục tạm và kết thúc phiên chụp
 */
export async function endSession(sessionId: string): Promise<void> {
    try {
        await fetch(`${API_URL}/end-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
        });
    } catch (error) {
        console.warn('Lỗi khi dọn dẹp session:', error);
    }
}

// --- WEBSOCKET LIVEVIEW STREAM HELPER ---

/**
 * Khởi tạo kết nối WebSocket với Backend để nhận luồng Live-view mượt mà từ máy ảnh Sony A6100.
 * @param onFrameReceived Callback nhận đối tượng Blob/URL hình ảnh mới nhất để render lên UI
 * @param onError Callback khi gặp sự cố kết nối
 * @returns Hàm đóng kết nối WebSocket
 */
export function connectLiveviewWebSocket(
    onFrameReceived: (frameUrl: string) => void,
    onError?: (error: Event) => void
): () => void {
    const socket = new WebSocket(WS_URL);
    socket.binaryType = 'arraybuffer';

    let currentObjectUrl: string | null = null;

    socket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
            const blob = new Blob([event.data], { type: 'image/jpeg' });

            // Giải phóng URL cũ để tránh rò rỉ bộ nhớ RAM
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }

            currentObjectUrl = URL.createObjectURL(blob);
            onFrameReceived(currentObjectUrl);
        }
    };

    socket.onerror = (err) => {
        console.error('[WS Liveview] Lỗi kết nối WebSocket:', err);
        if (onError) onError(err);
    };

    // Trả về hàm đóng kết nối để React Cleanup Effect sử dụng
    return () => {
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
        }
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
        }
    };
}

export { BASE_URL };
