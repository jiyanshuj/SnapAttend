"""
AI Attendance System — Pure Flask REST API
==========================================
Requirements:
    pip install flask flask-cors opencv-python numpy scikit-learn Pillow

Run:
    python attendance.py

Frontend (React):
    Run your Vite dev server separately on http://localhost:5173
    This API runs on http://localhost:5000
"""

import os
import cv2
import csv
import shutil
import pickle
import sqlite3
import threading
import numpy as np
from datetime import datetime, date
from flask import Flask, Response, request, jsonify
from flask_cors import CORS

# ─── sklearn KNN ───────────────────────────────────────────────────────────────
try:
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.preprocessing import LabelEncoder
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False

# ─── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ─── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
DATA_DIR       = os.path.join(BASE_DIR, "data")
MODEL_DIR      = os.path.join(BASE_DIR, "model")
ATTENDANCE_DIR = os.path.join(BASE_DIR, "attendance")
DB_PATH        = os.path.join(BASE_DIR, "students.db")
MODEL_PATH     = os.path.join(MODEL_DIR, "knn_model.pkl")
CASCADE_PATH   = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

for _d in [DATA_DIR, MODEL_DIR, ATTENDANCE_DIR]:
    os.makedirs(_d, exist_ok=True)

# ─── Global state ──────────────────────────────────────────────────────────────
_camera        = None
_camera_mode   = None          # "add" | "attendance" | None
_knn_model     = None
_label_encoder = None
_face_cascade  = cv2.CascadeClassifier(CASCADE_PATH)

# ══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ══════════════════════════════════════════════════════════════════════════════

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT    NOT NULL,
                enrollment   TEXT    UNIQUE NOT NULL,
                section      TEXT,
                course       TEXT,
                department   TEXT,
                image_count  INTEGER DEFAULT 0
            )
        """)
        conn.commit()

init_db()

# ══════════════════════════════════════════════════════════════════════════════
# KNN MODEL
# ══════════════════════════════════════════════════════════════════════════════

def load_model():
    global _knn_model, _label_encoder
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            data = pickle.load(f)
        _knn_model     = data["model"]
        _label_encoder = data["encoder"]
    else:
        _knn_model     = None
        _label_encoder = None


def train_model():
    """Scan data/ folder, build feature vectors, fit KNN, persist to disk."""
    global _knn_model, _label_encoder

    X, y = [], []
    for enr in os.listdir(DATA_DIR):
        folder = os.path.join(DATA_DIR, enr)
        if not os.path.isdir(folder):
            continue
        for img_file in os.listdir(folder):
            if not img_file.lower().endswith((".jpg", ".png")):
                continue
            img = cv2.imread(os.path.join(folder, img_file), cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            img  = cv2.resize(img, (64, 64))
            feat = img.flatten().astype(np.float32) / 255.0
            X.append(feat)
            y.append(enr)

    if len(set(y)) < 2:
        _knn_model     = None
        _label_encoder = None
        return False

    le    = LabelEncoder()
    y_enc = le.fit_transform(y)
    k     = min(3, len(set(y)))
    knn   = KNeighborsClassifier(n_neighbors=k, metric="euclidean")
    knn.fit(X, y_enc)

    _knn_model     = knn
    _label_encoder = le
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": knn, "encoder": le}, f)
    return True


def predict_face(gray_face):
    """Return (enrollment, confidence) or (None, 0.0)."""
    if _knn_model is None:
        return None, 0.0
    img  = cv2.resize(gray_face, (64, 64))
    feat = img.flatten().astype(np.float32) / 255.0
    feat = feat.reshape(1, -1)
    pred  = _knn_model.predict(feat)[0]
    proba = _knn_model.predict_proba(feat)[0]
    conf  = float(np.max(proba))
    enr   = _label_encoder.inverse_transform([pred])[0]
    return enr, conf


load_model()

# Print startup status
print("\n" + "="*50)
print("MODEL STATUS ON STARTUP:")
print(f"  Model File Exists: {os.path.exists(MODEL_PATH)}")
print(f"  Model Loaded: {_knn_model is not None}")
print(f"  scikit-learn Available: {SKLEARN_OK}")
if _knn_model is not None:
    print(f"  KNN Model ready with {_knn_model.n_neighbors} neighbors")
print("="*50 + "\n")

# ══════════════════════════════════════════════════════════════════════════════
# CAMERA HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def open_camera():
    global _camera
    if _camera is None or not _camera.isOpened():
        _camera = cv2.VideoCapture(0)
    return _camera


def release_camera():
    global _camera
    if _camera is not None:
        _camera.release()
        _camera = None


def read_frame():
    ret, frame = open_camera().read()
    return frame if ret else None

# ══════════════════════════════════════════════════════════════════════════════
# MJPEG STREAM GENERATORS
# ══════════════════════════════════════════════════════════════════════════════

def _encode(frame):
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"


def gen_add_stream(enrollment):
    """Live preview for add-student page — draws green box around detected face."""
    while _camera_mode == "add":
        frame = read_frame()
        if frame is None:
            break
        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = _face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=7,
                minSize=(50, 50),
                maxSize=(400, 400)
            )
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 220, 120), 2)
            cv2.putText(frame, "Face Detected", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 220, 120), 2)
        yield _encode(frame)


def gen_attendance_stream():
    """Live feed for take-attendance page — overlays name/enrollment on known faces."""
    name_cache = {}
    with get_db() as conn:
        for row in conn.execute("SELECT enrollment, name FROM students"):
            name_cache[row["enrollment"]] = row["name"]

    while _camera_mode == "attendance":
        frame = read_frame()
        if frame is None:
            break
        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = _face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=7,
                minSize=(50, 50),
                maxSize=(400, 400)
            )
        for (x, y, w, h) in faces:
            face_gray = gray[y:y + h, x:x + w]
            enr, conf = predict_face(face_gray)
            if enr and conf > 0.5:
                name = name_cache.get(enr, "Unknown")
                label = name
                color = (0, 220, 120)   # green = recognized
            else:
                label = "Unknown"
                color = (0, 60, 220)    # red = unknown
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(frame, label, (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        yield _encode(frame)

# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — CAMERA STREAMS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/video_feed/add/<enrollment>")
def video_feed_add(enrollment):
    global _camera_mode
    _camera_mode = "add"
    return Response(
        gen_add_stream(enrollment),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/video_feed/attendance")
def video_feed_attendance():
    global _camera_mode
    _camera_mode = "attendance"
    return Response(
        gen_attendance_stream(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/stop_camera", methods=["POST"])
def stop_camera():
    global _camera_mode
    _camera_mode = None
    release_camera()
    return jsonify({"ok": True})

# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — STUDENTS CRUD
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/students", methods=["GET"])
def get_students():
    """Return all students. Optional ?q= for name/enrollment search."""
    q = request.args.get("q", "").strip().lower()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM students ORDER BY name").fetchall()
    students = [dict(r) for r in rows]
    if q:
        students = [s for s in students
                    if q in s["name"].lower() or q in s["enrollment"].lower()]
    return jsonify(students)


@app.route("/api/students", methods=["POST"])
def add_student():
    """Register a new student. Validates duplicate enrollment."""
    data       = request.get_json(force=True)
    name       = data.get("name", "").strip()
    enrollment = data.get("enrollment", "").strip()
    section    = data.get("section", "").strip()
    course     = data.get("course", "").strip()
    department = data.get("department", "").strip()

    if not name or not enrollment:
        return jsonify({"error": "Name and Enrollment are required"}), 400

    with get_db() as conn:
        exists = conn.execute(
            "SELECT id FROM students WHERE enrollment = ?", (enrollment,)
        ).fetchone()
        if exists:
            return jsonify({"error": f"Enrollment '{enrollment}' already exists"}), 409

        conn.execute(
            "INSERT INTO students (name, enrollment, section, course, department) "
            "VALUES (?, ?, ?, ?, ?)",
            (name, enrollment, section, course, department)
        )
        conn.commit()

    os.makedirs(os.path.join(DATA_DIR, enrollment), exist_ok=True)
    return jsonify({"ok": True, "message": f"Student '{name}' registered successfully."})


@app.route("/api/students/<enrollment>", methods=["PUT"])
def update_student(enrollment):
    """Edit student details. Renames image folder if enrollment changes."""
    data           = request.get_json(force=True)
    new_name       = data.get("name", "").strip()
    new_enrollment = data.get("new_enrollment", enrollment).strip()
    section        = data.get("section", "").strip()
    course         = data.get("course", "").strip()
    department     = data.get("department", "").strip()

    if not new_name or not new_enrollment:
        return jsonify({"error": "Name and Enrollment are required"}), 400

    with get_db() as conn:
        conn.execute(
            "UPDATE students "
            "SET name=?, enrollment=?, section=?, course=?, department=? "
            "WHERE enrollment=?",
            (new_name, new_enrollment, section, course, department, enrollment)
        )
        conn.commit()

    if new_enrollment != enrollment:
        old_folder = os.path.join(DATA_DIR, enrollment)
        new_folder = os.path.join(DATA_DIR, new_enrollment)
        if os.path.exists(old_folder):
            os.rename(old_folder, new_folder)

    return jsonify({"ok": True, "message": "Student updated successfully."})


@app.route("/api/students/<enrollment>", methods=["DELETE"])
def delete_student(enrollment):
    """Delete student from DB, remove face images, retrain model in background."""
    with get_db() as conn:
        conn.execute("DELETE FROM students WHERE enrollment = ?", (enrollment,))
        conn.commit()

    folder = os.path.join(DATA_DIR, enrollment)
    if os.path.exists(folder):
        shutil.rmtree(folder)

    threading.Thread(target=train_model, daemon=True).start()
    return jsonify({"ok": True, "message": "Student deleted. Model retraining in background."})

# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — FACE CAPTURE & TRAINING
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/capture_face", methods=["POST"])
def capture_face():
    """
    Grab one frame from the live camera, detect a face,
    crop it and save as data/{enrollment}/face_NNN.jpg.
    """
    data       = request.get_json(force=True)
    enrollment = data.get("enrollment", "").strip()
    if not enrollment:
        return jsonify({"error": "Enrollment number is required"}), 400

    folder = os.path.join(DATA_DIR, enrollment)
    os.makedirs(folder, exist_ok=True)

    frame = read_frame()
    if frame is None:
        return jsonify({"error": "Camera not available"}), 500

    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=7,
            minSize=(50, 50),
            maxSize=(400, 400)
        )
    if len(faces) == 0:
        return jsonify({"error": "No face detected — please position your face clearly in the frame"}), 400

    x, y, w, h = faces[0]
    face_img   = cv2.resize(gray[y:y + h, x:x + w], (128, 128))

    existing = [f for f in os.listdir(folder) if f.endswith(".jpg")]
    idx      = len(existing) + 1
    cv2.imwrite(os.path.join(folder, f"face_{idx:03d}.jpg"), face_img)

    with get_db() as conn:
        conn.execute(
            "UPDATE students SET image_count = ? WHERE enrollment = ?",
            (idx, enrollment)
        )
        conn.commit()

    return jsonify({"ok": True, "count": idx, "message": f"Image {idx} captured successfully."})


@app.route("/api/train", methods=["POST"])
def trigger_train():
    """Manually trigger KNN model retraining."""
    if not SKLEARN_OK:
        return jsonify({"error": "scikit-learn is not installed"}), 500

    success = train_model()
    if success:
        return jsonify({"ok": True, "message": "KNN model trained successfully."})
    return jsonify({
        "ok": False,
        "message": "Not enough data — need at least 2 students with face images."
    })

# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — ATTENDANCE
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/attendance/capture", methods=["POST"])
def capture_attendance():
    """
    Detect all faces in current frame, recognize them via KNN,
    write new entries to attendance/attendance_YYYY-MM-DD.csv.
    Skips faces already marked today.
    """
    frame = read_frame()
    if frame is None:
        return jsonify({"error": "Camera not available"}), 500

    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=7,
            minSize=(50, 50),
            maxSize=(400, 400)
        )
    if len(faces) == 0:
        return jsonify({"error": "No face detected in the frame"}), 400

    today    = date.today().isoformat()
    att_file = os.path.join(ATTENDANCE_DIR, f"attendance_{today}.csv")
    exists   = os.path.exists(att_file)

    # Load already-marked enrollments for today
    already_marked = set()
    if exists:
        with open(att_file, newline="") as f:
            for row in csv.DictReader(f):
                already_marked.add(row.get("Enrollment", ""))

    # Build enrollment -> name map
    with get_db() as conn:
        student_map = {
            r["enrollment"]: r["name"]
            for r in conn.execute("SELECT enrollment, name FROM students")
        }

    records = []
    with open(att_file, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Name", "Enrollment", "Date", "Time"])
        if not exists:
            writer.writeheader()

        for (x, y, w, h) in faces:
            face_gray = gray[y:y + h, x:x + w]
            enr, conf = predict_face(face_gray)

            if enr and conf > 0.5:
                name = student_map.get(enr, enr)
                if enr in already_marked:
                    records.append({"enrollment": enr, "name": name, "status": "already_marked"})
                    continue
                now = datetime.now()
                writer.writerow({
                    "Name":       name,
                    "Enrollment": enr,
                    "Date":       today,
                    "Time":       now.strftime("%H:%M:%S"),
                })
                already_marked.add(enr)
                records.append({"enrollment": enr, "name": name, "status": "marked"})
            else:
                records.append({"enrollment": "Unknown", "name": "Unknown", "status": "unknown"})

    if not records:
        return jsonify({"error": "No recognizable faces found"}), 400

    return jsonify({"ok": True, "records": records})


@app.route("/api/attendance/today", methods=["GET"])
def get_today_attendance():
    """Return all attendance rows for today as JSON."""
    att_file = os.path.join(ATTENDANCE_DIR, f"attendance_{date.today().isoformat()}.csv")
    records  = []
    if os.path.exists(att_file):
        with open(att_file, newline="") as f:
            records = list(csv.DictReader(f))
    return jsonify(records)


@app.route("/api/attendance/history", methods=["GET"])
def get_attendance_history():
    """Return a sorted list of all attendance dates available."""
    files = sorted(
        [f for f in os.listdir(ATTENDANCE_DIR) if f.endswith(".csv")],
        reverse=True
    )
    dates = [f.replace("attendance_", "").replace(".csv", "") for f in files]
    return jsonify(dates)


@app.route("/api/attendance/<date_str>", methods=["GET"])
def get_attendance_by_date(date_str):
    """Return attendance rows for a specific date (YYYY-MM-DD)."""
    att_file = os.path.join(ATTENDANCE_DIR, f"attendance_{date_str}.csv")
    if not os.path.exists(att_file):
        return jsonify([])
    with open(att_file, newline="") as f:
        records = list(csv.DictReader(f))
    return jsonify(records)

# ══════════════════════════════════════════════════════════════════════════════
# ROUTES — HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/status", methods=["GET"])
def status():
    """Health-check endpoint for the React frontend."""
    with get_db() as conn:
        student_count = conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]
        students = conn.execute("SELECT enrollment, name, image_count FROM students").fetchall()
    
    students_info = [{"enrollment": s["enrollment"], "name": s["name"], "images": s["image_count"]} for s in students]
    
    return jsonify({
        "ok":            True,
        "student_count": student_count,
        "students":      students_info,
        "model_ready":   _knn_model is not None,
        "model_path":    MODEL_PATH,
        "model_exists":  os.path.exists(MODEL_PATH),
        "sklearn_ok":    SKLEARN_OK,
    })


@app.route("/api/debug", methods=["GET"])
def debug():
    """Debug endpoint to check system status."""
    with get_db() as conn:
        students = conn.execute("SELECT enrollment, name, image_count FROM students").fetchall()
    
    # Check data folders
    data_folders = {}
    if os.path.exists(DATA_DIR):
        for enr in os.listdir(DATA_DIR):
            folder = os.path.join(DATA_DIR, enr)
            if os.path.isdir(folder):
                images = [f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".png"))]
                data_folders[enr] = len(images)
    
    return jsonify({
        "model_loaded": _knn_model is not None,
        "model_file_exists": os.path.exists(MODEL_PATH),
        "sklearn_available": SKLEARN_OK,
        "database_students": [{"enrollment": s["enrollment"], "name": s["name"], "db_image_count": s["image_count"]} for s in students],
        "data_folder_images": data_folders,
        "base_dir": BASE_DIR,
        "data_dir": DATA_DIR,
        "model_dir": MODEL_DIR,
        "model_path": MODEL_PATH,
    })

# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Startup diagnostics
    print()
    print("  ┌─────────────────────────────────────────┐")
    print("  │   AI Attendance System — API Server     │")
    print("  │   http://localhost:5000                 │")
    print("  │                                         │")
    print("  │   React frontend: http://localhost:5173 │")
    print("  └─────────────────────────────────────────┘")
    print()
    
    print("DATABASE INFO:")
    with get_db() as conn:
        students = conn.execute("SELECT enrollment, name, image_count FROM students ORDER BY name").fetchall()
        print(f"  Total Students: {len(students)}")
        for s in students:
            print(f"    - {s['enrollment']}: {s['name']} ({s['image_count']} images)")
    print()
    
    print("DATA FOLDERS:")
    if os.path.exists(DATA_DIR):
        for enr in sorted(os.listdir(DATA_DIR)):
            folder = os.path.join(DATA_DIR, enr)
            if os.path.isdir(folder):
                images = [f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".png"))]
                print(f"  - {enr}: {len(images)} images")
    print()
    
    app.run(debug=True, threaded=True, port=5000)