from __future__ import annotations

import hashlib
import json
import mimetypes
import secrets
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(__file__).with_name("curiosity.sqlite3")
HOST = "127.0.0.1"
PORT = 8000


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row else None


def json_loads(value: str | None, fallback):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                device TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS courses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                teacher_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                description TEXT DEFAULT '',
                FOREIGN KEY(teacher_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS enrollments (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(student_id, course_id),
                FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS course_files (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                name TEXT NOT NULL,
                kind TEXT NOT NULL,
                size TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                title TEXT NOT NULL,
                starts_at TEXT NOT NULL,
                status TEXT NOT NULL,
                code TEXT NOT NULL,
                FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS meeting_messages (
                id TEXT PRIMARY KEY,
                meeting_id TEXT NOT NULL,
                author_id TEXT NOT NULL,
                author_name TEXT NOT NULL,
                body TEXT NOT NULL,
                kind TEXT NOT NULL,
                pending INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                meeting_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS activity_responses (
                id TEXT PRIMARY KEY,
                activity_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                answer TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE,
                FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        seed_db(conn)


def seed_db(conn: sqlite3.Connection) -> None:
    user_count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
    if user_count:
        return

    users = [
        ("teacher-garcia", "garcia@curiosity.test", "Prof. Garcia", "teacher"),
        ("student-emma", "emma@curiosity.test", "Emma Lucia", "student"),
        ("student-liam", "liam@curiosity.test", "Liam Torres", "student"),
        ("student-mateo", "mateo@curiosity.test", "Mateo Flores", "student"),
        ("student-sofia", "sofia@curiosity.test", "Sofia Diaz", "student"),
        ("student-santiago", "santiago@curiosity.test", "Santiago Vega", "student"),
        ("student-mia", "mia@curiosity.test", "Mia Castro", "student"),
        ("student-juan", "juan@curiosity.test", "Juan Paredes", "student"),
    ]
    for user_id, email, name, role in users:
        conn.execute(
            "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, name, role, hash_password("demo123"), now_iso()),
        )

    courses = [
        ("course-science", "Ciencia y tecnologia", "5632", "teacher-garcia", "Clase 5B con materiales ligeros y actividades interactivas."),
        ("course-math", "Razonamiento matematico", "4244", "teacher-garcia", "Algebra y funciones con Teacher Prompt IA."),
    ]
    for course_id, name, code, teacher_id, description in courses:
        conn.execute(
            "INSERT INTO courses (id, name, code, teacher_id, created_at, description) VALUES (?, ?, ?, ?, ?, ?)",
            (course_id, name, code, teacher_id, now_iso(), description),
        )

    enrollment_pairs = [
        ("student-emma", "course-science"),
        ("student-emma", "course-math"),
        ("student-liam", "course-math"),
        ("student-mateo", "course-math"),
        ("student-sofia", "course-science"),
        ("student-santiago", "course-science"),
        ("student-mia", "course-math"),
        ("student-juan", "course-science"),
    ]
    for student_id, course_id in enrollment_pairs:
        conn.execute(
            "INSERT INTO enrollments (id, student_id, course_id, created_at) VALUES (?, ?, ?, ?)",
            (f"enroll-{student_id}-{course_id}", student_id, course_id, now_iso()),
        )

    files = [
        ("file-1", "course-math", "Ejemplo Funcion lineal.png", "Imagen", "430 KB", "Disponible offline", 92),
        ("file-2", "course-math", "Ejemplo Funcion cuadratica.png", "Imagen", "510 KB", "Guardado para clase", 70),
        ("file-3", "course-math", "Ejemplo Funcion exponencial.png", "Imagen", "485 KB", "Pendiente al reconectar", 38),
        ("file-4", "course-science", "Resumen ciclo del agua.pdf", "PDF", "1.2 MB", "Prioritario", 84),
        ("file-5", "course-science", "Clase 2026-05-01.pdf", "PDF", "20 MB", "Programado", 58),
        ("file-6", "course-science", "Practica.xlsx", "Hoja", "1 MB", "Actualizado", 24),
    ]
    for item in files:
        conn.execute(
            "INSERT INTO course_files (id, course_id, name, kind, size, status, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (*item, now_iso()),
        )

    conn.execute(
        "INSERT INTO meetings (id, course_id, title, starts_at, status, code) VALUES (?, ?, ?, ?, ?, ?)",
        ("meeting-current", "course-math", "Clase 5B | Algebra", "2026-06-20T10:45:00", "active", "3942"),
    )

    messages = [
        ("msg-1", "meeting-current", "teacher-garcia", "Prof. Garcia", "Dejen sus dudas del ciclo del agua aqui.", "chat", 0),
        ("msg-2", "meeting-current", "student-emma", "Emma", "Puede repetir la diferencia entre condensacion y precipitacion?", "chat", 0),
        ("msg-3", "meeting-current", "system", "Sistema", "Tu comentario se guardara si la conexion falla.", "status", 1),
        ("msg-ai-1", "meeting-current", "ai", "Curiosity IA", "Puedo convertir la explicacion en actividad, ejemplo visual o pregunta rapida.", "ai", 0),
    ]
    for msg in messages:
        conn.execute(
            "INSERT INTO meeting_messages (id, meeting_id, author_id, author_name, body, kind, pending, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (*msg, now_iso()),
        )

    activities = [
        ("act-quiz", "meeting-current", "quiz", "Quiz rapido", "active", {"questions": 3, "responses": 6}),
        ("act-poll", "meeting-current", "poll", "Encuesta de comprension", "draft", {"options": ["Repasar", "Continuar", "Pausa"]}),
        ("act-board", "meeting-current", "board", "Pizarra colaborativa", "teacher_only", {"mode": "solo docente"}),
        ("act-groups", "meeting-current", "groups", "Grupos de trabajo", "ready", {"groups": 2}),
        ("act-timer", "meeting-current", "timer", "Temporizador", "paused", {"remaining": "02:00"}),
    ]
    for activity_id, meeting_id, kind, title, status, payload in activities:
        conn.execute(
            "INSERT INTO activities (id, meeting_id, kind, title, status, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (activity_id, meeting_id, kind, title, status, json.dumps(payload), now_iso()),
        )

    conn.execute(
        "INSERT INTO activity_responses (id, activity_id, student_id, answer, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        ("resp-1", "act-quiz", "student-emma", "Condensacion", "pending_sync", now_iso()),
    )


def public_user(user: sqlite3.Row | dict) -> dict:
    data = dict(user)
    data.pop("password_hash", None)
    data["createdAt"] = data.pop("created_at", data.get("createdAt", ""))
    return data


def get_user_from_token(conn: sqlite3.Connection, headers) -> sqlite3.Row | None:
    auth_header = headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    session = conn.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
    if not session:
        return None
    conn.execute("UPDATE sessions SET last_seen = ? WHERE token = ?", (now_iso(), token))
    return conn.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()


def require_user(conn: sqlite3.Connection, headers) -> sqlite3.Row:
    user = get_user_from_token(conn, headers)
    if not user:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Inicia sesion para continuar")
    return user


def courses_for_user(conn: sqlite3.Connection, user: sqlite3.Row) -> list[dict]:
    if user["role"] == "teacher":
        rows = conn.execute("SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at", (user["id"],)).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT c.* FROM courses c
            JOIN enrollments e ON e.course_id = c.id
            WHERE e.student_id = ?
            ORDER BY c.created_at
            """,
            (user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


def students_for_courses(conn: sqlite3.Connection, course_ids: list[str]) -> list[dict]:
    if not course_ids:
        return []
    placeholders = ",".join("?" for _ in course_ids)
    rows = conn.execute(
        f"""
        SELECT DISTINCT u.id, u.name, u.email, u.role, c.code AS courseCode
        FROM users u
        JOIN enrollments e ON e.student_id = u.id
        JOIN courses c ON c.id = e.course_id
        WHERE c.id IN ({placeholders}) AND u.role = 'student'
        ORDER BY u.name
        """,
        course_ids,
    ).fetchall()
    students = []
    for index, row in enumerate(rows):
        score = [18, 17, 15, 19, 13, 16, 14, 18][index % 8]
        attendance = [96, 88, 78, 98, 68, 91, 72, 84][index % 8]
        status = "Riesgo" if attendance < 70 else "Seguimiento" if attendance < 80 else "Destacada" if score >= 18 else "Regular"
        item = dict(row)
        item.update({"score": score, "attendance": attendance, "status": status})
        students.append(item)
    return students


def files_for_courses(conn: sqlite3.Connection, course_ids: list[str]) -> list[dict]:
    if not course_ids:
        return []
    placeholders = ",".join("?" for _ in course_ids)
    rows = conn.execute(f"SELECT * FROM course_files WHERE course_id IN ({placeholders}) ORDER BY created_at", course_ids).fetchall()
    return [dict(row) for row in rows]


def student_dashboard(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    courses = courses_for_user(conn, user)
    course_ids = [course["id"] for course in courses]
    classmates = [student for student in students_for_courses(conn, course_ids) if student["id"] != user["id"]]
    resources = files_for_courses(conn, course_ids)
    progress = min(92, 48 + max(len(courses), 1) * 11)
    return {
        "user": public_user(user),
        "courses": courses,
        "classmates": classmates,
        "progress": progress,
        "resources": resources,
        "metrics": [
            {"label": "Tu asistencia promedio", "value": "91%"},
            {"label": "Tu puntaje de participacion promedio", "value": "16.8/20"},
            {"label": "Ranking del curso", "value": "#4"},
            {"label": "Insignias obtenidas", "value": 4},
        ],
        "messages": [
            {"title": "Anuncio del docente", "body": "Material previo disponible para la proxima sesion.", "time": "Hoy"},
            {"title": "Duda respondida", "body": "Tu docente respondio una pregunta en el historial del curso.", "time": "Fijado"},
            {"title": "Conectividad", "body": "Modo ahorro recomendado si tu senal baja durante la clase.", "time": "Esta semana"},
        ],
    }


def teacher_dashboard(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    courses = courses_for_user(conn, user)
    course_ids = [course["id"] for course in courses]
    students = students_for_courses(conn, course_ids)
    resources = files_for_courses(conn, course_ids)
    attendance = round(sum(student["attendance"] for student in students) / len(students)) if students else 0
    participation = round(sum(student["score"] for student in students) / len(students), 1) if students else 0
    return {
        "user": public_user(user),
        "courses": courses,
        "students": students,
        "resources": resources,
        "metrics": [
            {"label": "Asistencia promedio", "value": f"{attendance}%"},
            {"label": "Puntaje de participacion promedio", "value": f"{participation}/20"},
            {"label": "Duracion promedio de sesiones", "value": "1h 30m"},
            {"label": "Estudiantes en seguimiento", "value": len([s for s in students if s["status"] in ["Riesgo", "Seguimiento"]])},
        ],
        "messages": [
            {"title": "Anuncio publicado", "body": "Material previo disponible para tu curso principal.", "time": "Hoy"},
            {"title": "Historial de dudas", "body": "3 conversaciones resueltas quedaron guardadas en el curso.", "time": "Fijado"},
            {"title": "Mensaje preventivo", "body": "Se envio recordatorio a estudiantes con baja actividad.", "time": "Esta semana"},
        ],
    }


def meeting_state(conn: sqlite3.Connection, user: sqlite3.Row | None = None) -> dict:
    meeting = conn.execute("SELECT * FROM meetings WHERE id = 'meeting-current'").fetchone()
    course = conn.execute("SELECT * FROM courses WHERE id = ?", (meeting["course_id"],)).fetchone()
    files = files_for_courses(conn, [course["id"]])
    messages = conn.execute("SELECT * FROM meeting_messages WHERE meeting_id = ? ORDER BY created_at", (meeting["id"],)).fetchall()
    activities = conn.execute("SELECT * FROM activities WHERE meeting_id = ? ORDER BY created_at", (meeting["id"],)).fetchall()
    responses = conn.execute(
        """
        SELECT ar.*, u.name AS student_name
        FROM activity_responses ar
        JOIN users u ON u.id = ar.student_id
        WHERE activity_id IN (SELECT id FROM activities WHERE meeting_id = ?)
        ORDER BY ar.created_at
        """,
        (meeting["id"],),
    ).fetchall()
    participants = students_for_courses(conn, [course["id"]])
    teacher = conn.execute("SELECT id, name, email, role FROM users WHERE id = ?", (course["teacher_id"],)).fetchone()
    participant_rows = [
        {"id": teacher["id"], "name": teacher["name"], "role": "Docente", "connection": "Estable", "level": "good", "activity": "Compartiendo pantalla"},
    ]
    levels = [("Estable", "good", "Audio activo"), ("Inestable", "warn", "Respuesta pendiente"), ("Modo ahorro", "warn", "Chat disponible"), ("Desconectado", "bad", "Reingreso sugerido")]
    for index, participant in enumerate(participants):
        connection, level, activity = levels[index % len(levels)]
        participant_rows.append(
            {
                "id": participant["id"],
                "name": "Tu" if user and participant["id"] == user["id"] else participant["name"],
                "role": "Estudiante",
                "connection": connection,
                "level": level,
                "activity": activity,
            }
        )

    return {
        "meeting": dict(meeting),
        "course": dict(course),
        "files": files,
        "messages": [dict(message) for message in messages],
        "activities": [{**dict(activity), "payload": json_loads(activity["payload"], {})} for activity in activities],
        "responses": [dict(response) for response in responses],
        "participants": participant_rows,
        "timer": {"remaining": "02:00", "status": "paused"},
        "reactions": [
            {"label": "Tengo una duda", "count": 3},
            {"label": "Necesito una pausa", "count": 1},
            {"label": "Voy bien", "count": 6},
        ],
    }


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


class CuriosityHandler(SimpleHTTPRequestHandler):
    server_version = "CuriosityBackend/1.0"

    def translate_path(self, path: str) -> str:
        parsed = urlparse(path)
        clean = unquote(parsed.path)
        if clean == "/":
            clean = "/index.html"
        candidate = (ROOT / clean.lstrip("/")).resolve()
        if not str(candidate).startswith(str(ROOT)):
            return str(ROOT / "index.html")
        return str(candidate)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.startswith("/api/"):
            self.handle_api("GET")
        else:
            super().do_GET()

    def do_POST(self) -> None:
        self.handle_api("POST")

    def do_PATCH(self) -> None:
        self.handle_api("PATCH")

    def do_DELETE(self) -> None:
        self.handle_api("DELETE")

    def guess_type(self, path: str) -> str:
        if path.endswith(".js"):
            return "text/javascript"
        return mimetypes.guess_type(path)[0] or "application/octet-stream"

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw) if raw else {}

    def send_json(self, payload: dict | list, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_api(self, method: str) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)
        try:
            with connect() as conn:
                payload = self.route_api(conn, method, path, query)
            self.send_json(payload)
        except ApiError as exc:
            self.send_json({"error": exc.message}, exc.status)
        except Exception as exc:  # Keep local dev usable while surfacing the error.
            self.send_json({"error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def route_api(self, conn: sqlite3.Connection, method: str, path: str, query: dict) -> dict | list:
        if method == "GET" and path == "/api/health":
            return {"ok": True, "service": "curiosity-backend", "time": now_iso()}

        if method == "POST" and path == "/api/auth/login":
            body = self.read_json()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if not user or user["password_hash"] != hash_password(password):
                raise ApiError(HTTPStatus.UNAUTHORIZED, "Correo o contrasena invalidos")
            token = secrets.token_urlsafe(32)
            conn.execute(
                "INSERT INTO sessions (token, user_id, device, status, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)",
                (token, user["id"], body.get("device") or "Browser local", "Activa", now_iso(), now_iso()),
            )
            return {"token": token, "user": public_user(user)}

        if method == "POST" and path == "/api/auth/register":
            body = self.read_json()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            name = (body.get("name") or email.split("@")[0] or "Usuario").strip()
            role = body.get("role") or "student"
            if not email or "@" not in email:
                raise ApiError(HTTPStatus.BAD_REQUEST, "Correo invalido")
            if len(password) < 6:
                raise ApiError(HTTPStatus.BAD_REQUEST, "La contrasena debe tener al menos 6 caracteres")
            user_id = f"user-{secrets.token_hex(6)}"
            try:
                conn.execute(
                    "INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, email, name, role, hash_password(password), now_iso()),
                )
            except sqlite3.IntegrityError:
                raise ApiError(HTTPStatus.CONFLICT, "El usuario ya existe")
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            token = secrets.token_urlsafe(32)
            conn.execute(
                "INSERT INTO sessions (token, user_id, device, status, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)",
                (token, user_id, "Browser local", "Activa", now_iso(), now_iso()),
            )
            return {"token": token, "user": public_user(user)}

        if method == "POST" and path == "/api/auth/logout":
            auth = self.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                conn.execute("DELETE FROM sessions WHERE token = ?", (auth.split(" ", 1)[1],))
            return {"ok": True}

        if path == "/api/users/me" and method in {"GET", "PATCH"}:
            user = require_user(conn, self.headers)
            if method == "GET":
                sessions = conn.execute("SELECT device, status, last_seen FROM sessions WHERE user_id = ? ORDER BY last_seen DESC", (user["id"],)).fetchall()
                return {"user": public_user(user), "sessions": [dict(session) for session in sessions]}
            body = self.read_json()
            name = (body.get("name") or user["name"]).strip()
            email = (body.get("email") or user["email"]).strip().lower()
            role = body.get("role") if body.get("role") in {"student", "teacher"} else user["role"]
            conn.execute("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?", (name, email, role, user["id"]))
            updated = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
            return {"user": public_user(updated)}

        if method == "DELETE" and path == "/api/users/me/sessions":
            user = require_user(conn, self.headers)
            auth = self.headers.get("Authorization", "")
            token = auth.split(" ", 1)[1] if auth.startswith("Bearer ") else ""
            conn.execute("DELETE FROM sessions WHERE user_id = ? AND token != ?", (user["id"], token))
            return {"ok": True}

        if method == "GET" and path == "/api/courses":
            user = require_user(conn, self.headers)
            return {"courses": courses_for_user(conn, user)}

        if method == "POST" and path == "/api/courses":
            user = require_user(conn, self.headers)
            if user["role"] != "teacher":
                raise ApiError(HTTPStatus.FORBIDDEN, "No tienes permiso para crear cursos")
            body = self.read_json()
            name = (body.get("name") or "Nuevo curso").strip()
            code = (body.get("code") or secrets.token_hex(3)).upper()[:6]
            course_id = f"course-{secrets.token_hex(6)}"
            conn.execute(
                "INSERT INTO courses (id, name, code, teacher_id, created_at, description) VALUES (?, ?, ?, ?, ?, ?)",
                (course_id, name, code, user["id"], now_iso(), body.get("description") or ""),
            )
            return {"course": dict(conn.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone())}

        if method == "POST" and path == "/api/courses/enroll":
            user = require_user(conn, self.headers)
            if user["role"] != "student":
                raise ApiError(HTTPStatus.FORBIDDEN, "Solo estudiantes pueden unirse a cursos")
            body = self.read_json()
            code = (body.get("code") or "").strip().upper()
            course = conn.execute("SELECT * FROM courses WHERE code = ?", (code,)).fetchone()
            if not course:
                raise ApiError(HTTPStatus.NOT_FOUND, "No se encontro el curso")
            conn.execute(
                "INSERT OR IGNORE INTO enrollments (id, student_id, course_id, created_at) VALUES (?, ?, ?, ?)",
                (f"enroll-{user['id']}-{course['id']}", user["id"], course["id"], now_iso()),
            )
            return {"course": dict(course)}

        if method == "GET" and path == "/api/dashboard/student":
            user = require_user(conn, self.headers)
            return student_dashboard(conn, user)

        if method == "GET" and path == "/api/dashboard/teacher":
            user = require_user(conn, self.headers)
            return teacher_dashboard(conn, user)

        if method == "GET" and path == "/api/workspace":
            user = require_user(conn, self.headers)
            courses = courses_for_user(conn, user)
            course_id = query.get("course", [courses[0]["id"] if courses else ""])[0]
            files = files_for_courses(conn, [course_id]) if course_id else []
            students = students_for_courses(conn, [course_id]) if course_id else []
            return {
                "courses": courses,
                "activeCourseId": course_id,
                "files": files,
                "students": students,
                "sessions": [
                    {"date": "2026-04-03", "duration": "80 min", "status": "Grabacion", "size": "20MB"},
                    {"date": "2026-04-10", "duration": "95 min", "status": "Sincronizado", "size": "50MB"},
                    {"date": "2026-04-17", "duration": "70 min", "status": "Audio ligero", "size": "8MB"},
                    {"date": "2026-05-01", "duration": "90 min", "status": "Grabacion", "size": "32MB"},
                ],
            }

        if method == "GET" and path == "/api/meetings/current":
            user = get_user_from_token(conn, self.headers)
            return meeting_state(conn, user)

        if method == "POST" and path == "/api/meetings/current/messages":
            user = require_user(conn, self.headers)
            body = self.read_json()
            message_id = f"msg-{secrets.token_hex(6)}"
            kind = body.get("kind") or "chat"
            conn.execute(
                "INSERT INTO meeting_messages (id, meeting_id, author_id, author_name, body, kind, pending, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (message_id, "meeting-current", user["id"], user["name"], body.get("body") or "", kind, int(bool(body.get("pending"))), now_iso()),
            )
            return {"message": dict(conn.execute("SELECT * FROM meeting_messages WHERE id = ?", (message_id,)).fetchone())}

        if method == "POST" and path == "/api/meetings/current/reactions":
            user = require_user(conn, self.headers)
            body = self.read_json()
            return {"ok": True, "reaction": body.get("reaction") or "Mano levantada", "user": user["name"]}

        if method == "POST" and path == "/api/meetings/current/activities":
            user = require_user(conn, self.headers)
            if user["role"] != "teacher":
                # Students can still create local/draft responses in this demo.
                body = self.read_json()
                return {"ok": True, "status": "pending_sync", "activity": body.get("kind") or "response"}
            body = self.read_json()
            activity_id = f"act-{secrets.token_hex(6)}"
            conn.execute(
                "INSERT INTO activities (id, meeting_id, kind, title, status, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    activity_id,
                    "meeting-current",
                    body.get("kind") or "quiz",
                    body.get("title") or "Actividad nueva",
                    "ready",
                    json.dumps(body.get("payload") or {}),
                    now_iso(),
                ),
            )
            return {"activity": dict(conn.execute("SELECT * FROM activities WHERE id = ?", (activity_id,)).fetchone())}

        raise ApiError(HTTPStatus.NOT_FOUND, "Endpoint no encontrado")


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), CuriosityHandler)
    print(f"Curiosity backend listo en http://{HOST}:{PORT}")
    print("Usuarios demo: garcia@curiosity.test / demo123, emma@curiosity.test / demo123")
    server.serve_forever()


if __name__ == "__main__":
    main()
