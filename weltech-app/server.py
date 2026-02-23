from flask import Flask, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import os
import threading
import base64
import numpy as np
import datetime

app = Flask(__name__)
CORS(app)

# --- ⚙️ ตั้งค่า (CONFIG) ---
MODEL_PATH = "best.pt" 
SNAPSHOT_DIR = "snapshots"
CONF_THRESHOLD = 0.25 

if not os.path.exists(SNAPSHOT_DIR):
    os.makedirs(SNAPSHOT_DIR)

# โหลด Model ไว้ที่ Global เพื่อให้ทั้ง Thread กล้อง และ API เรียกใช้ได้ทันที
model = None
try:
    model = YOLO(MODEL_PATH)
    print("✅ Model Loaded Successfully")
except Exception as e:
    print(f"❌ Load Model Error: {e}")

is_running = False

CLASS_COLORS = {
    'neutrophil': (255, 0, 0),  
    'lymphocyte': (0, 255, 0),
    'monocyte':   (0, 255, 255),
    'eosinophil': (0, 0, 255),
    'basophil':   (255, 0, 255),
    'platelet':   (128, 128, 128),
    'rbc':         (200, 200, 200)
}
DEFAULT_COLOR = (255, 255, 255)

# --- ฟังก์ชันช่วยวาดกรอบ (ใช้ร่วมกันทั้ง 2 ระบบ) ---
def draw_predictions(frame, results):
    if not results or len(results) == 0:
        return frame
        
    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        
        # ดึงชื่อคลาสอย่างปลอดภัย
        class_name = model.names[cls_id] if model and cls_id in model.names else f"class_{cls_id}"

        color = CLASS_COLORS.get(class_name.lower(), DEFAULT_COLOR)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        
        label = f"{class_name} {conf:.2f}"
        t_size = cv2.getTextSize(label, 0, fontScale=0.5, thickness=1)[0]
        cv2.rectangle(frame, (x1, y1 - 20), (x1 + t_size[0], y1), color, -1)
        
        text_color = (255, 255, 255) if sum(color) < 400 else (0, 0, 0)
        cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1)
    return frame

# --- ระบบเดิม: กล้อง USB / IP Camera (รันใน Thread) ---
def run_detection_process(source):
    global is_running
    is_running = True
    
    cap = cv2.VideoCapture(source)
    if not cap.isOpened() and isinstance(source, int):
        cap = cv2.VideoCapture(0)

    window_name = "Smart Lab AI - Microscope View"

    while cap.isOpened() and is_running:
        ret, frame = cap.read()
        if not ret: break

        results = model(frame, imgsz=640, conf=CONF_THRESHOLD, verbose=False)
        frame = draw_predictions(frame, results)

        cv2.imshow(window_name, frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'): break
        elif key == ord('s'):
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{SNAPSHOT_DIR}/lab_snap_{timestamp}.jpg"
            cv2.imwrite(filename, frame)
            # Flash Effect
            cv2.rectangle(frame, (0, 0), (frame.shape[1], frame.shape[0]), (255, 255, 255), -1)
            cv2.imshow(window_name, frame)
            cv2.waitKey(50)

        if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1: break

    cap.release()
    cv2.destroyAllWindows()
    is_running = False
    print("=== Camera Closed ===")

# --- API Endpoints ---

@app.route('/start-smart-lab', methods=['GET'])
def index():
    return jsonify({"status": "online", "message": "WelTech AI Server is running"}), 200
def start_smart_lab():
    global is_running
    if is_running:
        return jsonify({"status": "warning", "message": "กล้องทำงานอยู่แล้ว"}), 200

    src = request.args.get('source', default="1")
    final_source = int(src) if src.isdigit() else src

    thread = threading.Thread(target=run_detection_process, args=(final_source,))
    thread.daemon = True
    thread.start()
    return jsonify({"status": "success", "message": f"เปิด Source: {src}"})

@app.route('/process-frame', methods=['POST'])
def process_frame():
    try:
        data = request.json
        image_b64 = data.get('image')
        if not image_b64:
            return jsonify({"status": "error", "message": "No image data"}), 400

        # แปลง base64 เป็น OpenCV Image
        encoded_data = image_b64.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # AI Predict
        results = model(frame, imgsz=640, conf=CONF_THRESHOLD, verbose=False)
        
        # นับจำนวนเซลล์แยกตามประเภท
        counts = {}
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            name = model.names[cls_id] if cls_id in model.names else f"class_{cls_id}"
            counts[name] = counts.get(name, 0) + 1

        return jsonify({
            "status": "success",
            "counts": counts,
            "total": len(results[0].boxes)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/stop-smart-lab', methods=['GET'])
def stop_smart_lab():
    global is_running
    is_running = False 
    return jsonify({"status": "success", "message": "สั่งปิดกล้องเรียบร้อย"})

if __name__ == '__main__':
    # รันบน 0.0.0.0 เพื่อให้เข้าถึงผ่านวง LAN ได้
    app.run(host='0.0.0.0', port=5000)