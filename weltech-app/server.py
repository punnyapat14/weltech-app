from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from ultralytics import YOLO
import cv2
import os
import threading
import base64
import numpy as np
import datetime
import gc  # เพิ่ม import gc เพื่อจัดการคืนพื้นที่ RAM

app = Flask(__name__)
# อนุญาต CORS และ Headers ทุกประเภท ป้องกันปัญหา Cross-Origin
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*"}})

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
    'rbc':        (200, 200, 200)
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

# สร้างหน้าแรกไว้เช็คสถานะแยกต่างหาก
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "online", "message": "WelTech AI Server is running"}), 200

# API สำหรับเปิดกล้อง
@app.route('/start-smart-lab', methods=['GET'])
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

# API สำหรับประมวลผลเฟรมภาพจากเบราว์เซอร์
# เพิ่ม OPTIONS เพื่อรองรับ Preflight Request ของเบราว์เซอร์
@app.route('/process-frame', methods=['POST', 'OPTIONS'])
@cross_origin()
def process_frame():
    # จัดการ Preflight Request ทันทีโดยไม่ต้องประมวลผลรูป
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        data = request.json
        image_b64 = data.get('image')
        if not image_b64:
            return jsonify({"status": "error", "message": "No image data"}), 400

        # ตัด Header และแปลง base64 เป็น OpenCV Image อย่างปลอดภัย
        encoded_data = image_b64.split(',')[1] if ',' in image_b64 else image_b64
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # แก้ไข Indentation Error (ย่อหน้าผิด) ตรงนี้
        if frame is None:
            return jsonify({"status": "error", "message": "ไม่สามารถอ่านรูปภาพได้ (Image Decode Failed)"}), 400

        # AI Predict
        results = model(frame, imgsz=640, conf=CONF_THRESHOLD, verbose=False)
        
        # นับจำนวนเซลล์แยกตามประเภท
        counts = {}
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            name = model.names[cls_id] if cls_id in model.names else f"class_{cls_id}"
            counts[name] = counts.get(name, 0) + 1

        # นำภาพไปวาดกรอบ Bounding Box ด้วยฟังก์ชันที่เตรียมไว้
        processed_frame = draw_predictions(frame.copy(), results)

        # แปลงรูปภาพที่วาดกรอบแล้ว กลับเป็น Base64
        _, buffer = cv2.imencode('.jpg', processed_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # เติม Header ของรูปกลับเข้าไป
        final_processed_image = f"data:image/jpeg;base64,{processed_b64}"

        return jsonify({
            "status": "success",
            "counts": counts,
            "total": len(results[0].boxes),
            "processed_image": final_processed_image
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc() # พิมพ์ error ลง console เพื่อให้หาบั๊กง่ายขึ้น
        return jsonify({"status": "error", "message": str(e)}), 500
        
    finally:
        # บังคับเคลียร์ RAM ทุกครั้งหลังทำงานเสร็จ เพื่อป้องกันปัญหา Out of Memory บน Render
        gc.collect()

@app.route('/stop-smart-lab', methods=['GET'])
def stop_smart_lab():
    global is_running
    is_running = False 
    return jsonify({"status": "success", "message": "สั่งปิดกล้องเรียบร้อย"})

if __name__ == '__main__':
    # การตั้งค่า Port สำหรับระบบ Cloud (เช่น Render/Heroku)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)