# 🏥 SaludPlus - Sistema de Gestión de Citas Médicas (Vue 3 + Pinia + JSON-Server)

Sistema web profesional desarrollado para la **Práctica 2** del módulo de desarrollo web con **Vue 3**, implementando **Composition API**, **Pinia**, **Vue Router 4**, **Axios** y persistencia REST con **JSON-Server Auth**.

---

## 🚀 Características Principales

1. **Gestión de Citas Médicas (CRUD Completo)**:
   - Crear nueva cita con validación reactiva de paciente, médico, fecha, hora, motivo y costo.
   - Listar citas con badges dinámicos según el estado y color de la especialidad del médico.
   - Buscador en tiempo real por nombre del paciente y motivo.
   - Filtro por médico especialista y filtro por estado (`Pendiente`, `Confirmada`, `Atendida`, `Cancelada`).
   - Vista de detalle individual con navegación por ID (`/citas/:id`).
   - Edición y eliminación con confirmación modal.

2. **Gestión de Médicos y Especialidades (CRUD Completo)**:
   - Registro de especialistas con nombre, especialidad, email, teléfono y color heráldico.
   - Buscador de médicos por nombre o especialidad.
   - Contador de citas asociadas por médico.
   - Control de integridad referencial antes de eliminar médicos con citas asignadas.

3. **Autenticación y Seguridad (JWT)**:
   - Registro e Inicio de sesión con tokens JWT persistentes en `localStorage` y Pinia.
   - Navigation Guards globales (`beforeEach`) para protección estricta de rutas privadas.
   - Interceptores de Axios para inyección automática de cabeceras `Bearer Token` y manejo de expiración de sesión (401).

4. **Variables de Entorno**:
   - Configuración mediante `.env` (`VITE_API_URL`).

---

## 🛠️ Tecnologías

- **Frontend**: Vue.js 3.4 (Composition API `<script setup>`), Vite 5.
- **Gestor de Estado**: Pinia 2.
- **Enrutamiento**: Vue Router 4 (Lazy loading + Navigation Guards).
- **HTTP Client**: Axios con Request & Response Interceptors.
- **Backend Mock**: JSON Server Auth con JWT y contraseñas cifradas en Bcrypt.
- **DevOps**: Docker & Docker Compose.

---

## ⚡ Instrucciones de Inicio Rápido

### Prerrequisitos
- Node.js >= 18
- npm

### Pasos
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor backend y la aplicación Vue simultáneamente
npm run serve
```

La aplicación estará lista en:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

### 👤 Credenciales de Prueba
- **Email**: `admin@saludplus.com`
- **Contraseña**: `123456`
*(o puedes registrar cualquier nuevo usuario desde la pantalla de registro)*
