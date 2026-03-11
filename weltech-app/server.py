from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from ultralytics import YOLO
import cv2
import os
import base64
import numpy as np
import gc

app = Flask(__name__)
# อนุญาต CORS ป้องกันปัญหา Cross-Origin
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*"}})

# ================== CONFIG ==================
# ---------- Detection ----------
DET_MODEL_PATH = "detect.pt"  # เปลี่ยนชื่อไฟล์อย่าให้มีช่องว่าง
IMGSZ = 640  # ⚠️ ปรับลดจาก 1536 เป็น 640 เพื่อให้รันบน Cloud ฟรีได้เร็วและไม่ Timeout
CONF = 0.5
IOU = 0.45

# ---------- Classification ----------
CLS_MODEL_PATH = "class.pt"
CLS_INPUT_SIZE = 224
TARGET_CLASS_ID = 2   # สมมติว่า 2 คือ WBC

# ---------- Crop & Style ----------
CROP_MARGIN = 0.25    # ขยายกรอบ 25%
FONT = cv2.FONT_HERSHEY_DUPLEX
FONT_SCALE = 0.5
FONT_THICKNESS = 1
TEXT_COLOR = (255, 255, 255)
BG_ALPHA = 0.45
PADDING_X = 6
PADDING_Y = 4

CLASS_COLORS = {
    0: (0, 0, 255),
    1: (0, 255, 0),
    2: (255, 0, 0),
    3: (0, 255, 255),
}
DEFAULT_COLOR = (180, 180, 180)
# ==========================================

print("🚀 Loading AI Models...")
try:
    det_model = YOLO(DET_MODEL_PATH)
    cls_model = YOLO(CLS_MODEL_PATH)
    print("✅ Both Models Loaded Successfully")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# ---------- Helper Functions ----------
def crop_with_margin_and_resize(img, box, margin, out_size):
    h, w = img.shape[:2]
    x1, y1, x2, y2 = map(int, box)

    bw = x2 - x1
    bh = y2 - y1

    mx = int(bw * margin)
    my = int(bh * margin)

    nx1 = max(0, x1 - mx)
    ny1 = max(0, y1 - my)
    nx2 = min(w, x2 + mx)
    ny2 = min(h, y2 + my)

    crop = img[ny1:ny2, nx1:nx2]
    if crop.size == 0:
        return None

    crop_resized = cv2.resize(crop, (out_size, out_size))
    return crop_resized

def classify_wbc(crop_bgr, cls_model):
    # โมเดล Classify มักจะเทรนมากับภาพ RGB
    crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    res = cls_model(crop_rgb, imgsz=CLS_INPUT_SIZE, verbose=False)[0]
    
    cls_id = int(res.probs.top1)
    conf = float(res.probs.top1conf)
    name = cls_model.names[cls_id]
    return name, conf

def draw_label(out, overlay, text, x1, y1, color):
    (tw, th), _ = cv2.getTextSize(text, FONT, FONT_SCALE, FONT_THICKNESS)
    tx1 = x1
    ty1 = y1 - th - PADDING_Y * 2
    tx2 = x1 + tw + PADDING_X * 2
    ty2 = y1

    if ty1 < 0:
        ty1 = y1
        ty2 = y1 + th + PADDING_Y * 2

    cv2.rectangle(overlay, (tx1, ty1), (tx2, ty2), color, -1)
    cv2.putText(out, text, (tx1 + PADDING_X, ty2 - PADDING_Y),
                FONT, FONT_SCALE, TEXT_COLOR, FONT_THICKNESS, cv2.LINE_AA)

# ================== API ENDPOINTS ==================
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "online", "message": "WelTech AI Server (Dual Model) is running"}), 200

@app.route('/process-frame', methods=['POST', 'OPTIONS'])
@cross_origin()
def process_frame():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        data = request.json
        image_b64 = data.get('image')
        if not image_b64:
            return jsonify({"status": "error", "message": "No image data"}), 400

        # Decode Image
        encoded_data = image_b64.split(',')[1] if ',' in image_b64 else image_b64
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"status": "error", "message": "Image Decode Failed"}), 400

        # 1. Detection Phase
        results = det_model(frame, imgsz=IMGSZ, conf=CONF, iou=IOU, verbose=False)[0]
        
        counts = {}          # นับรวมทั้งหมด
        wbc_subcounts = {}   # นับแยกชนิด WBC

        vis = frame.copy()
        overlay = frame.copy()

        if results.boxes is not None and len(results.boxes) > 0:
            boxes = results.boxes.xyxy.cpu().numpy()
            clss = results.boxes.cls.cpu().numpy()
            confs = results.boxes.conf.cpu().numpy()
            det_names = det_model.names

            for box, cls, conf in zip(boxes, clss, confs):
                x1, y1, x2, y2 = map(int, box)
                cls = int(cls)
                base_name = det_names[cls]
                
                counts[base_name] = counts.get(base_name, 0) + 1
                color = CLASS_COLORS.get(cls, DEFAULT_COLOR)
                cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
                label = f"{base_name} {conf:.2f}"

                # 2. Classification Phase (เฉพาะ WBC)
                if cls == TARGET_CLASS_ID:
                    crop = crop_with_margin_and_resize(frame, box, CROP_MARGIN, CLS_INPUT_SIZE)
                    if crop is not None:
                        wbc_name, wbc_conf = classify_wbc(crop, cls_model)
                        wbc_subcounts[wbc_name] = wbc_subcounts.get(wbc_name, 0) + 1
                        
                        # เพิ่มชื่อชนิดย่อยลงใน Label และตารางนับรวม
                        label += f" | {wbc_name} {wbc_conf:.2f}"
                        counts[wbc_name] = counts.get(wbc_name, 0) + 1

                # วาด Label
                draw_label(vis, overlay, label, x1, y1, color)

        # รวม Layer สีใส (Alpha)
        cv2.addWeighted(overlay, BG_ALPHA, vis, 1 - BG_ALPHA, 0, vis)

        # Encode กลับเป็น Base64
        _, buffer = cv2.imencode('.jpg', vis, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')
        final_processed_image = f"data:image/jpeg;base64,{processed_b64}"

        return jsonify({
            "status": "success",
            "counts": counts,
            "wbc_details": wbc_subcounts,
            "total": len(results.boxes) if results.boxes is not None else 0,
            "processed_image": final_processed_image
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
        
    finally:
        gc.collect()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port)