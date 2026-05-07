# ChampionCoat - Sistema de Control de Asistencia

Sistema web completo para control de asistencia de empleados en sucursales de ChampionCoat, una empresa de pinturas. Incluye reconocimiento facial, geolocalización y panel administrativo.

## 🚀 Características

- **Autenticación** con roles: Administrador, Gerente y Empleado
- **Check-in/Check-out** con verificación facial y geolocalización
- **Geocercas** por sucursal con validación de radio permitido (fórmula Haversine)
- **Estados de asistencia**: A tiempo, Retardo, Falta, Salida pendiente, Fuera de ubicación, Facial fallido
- **Ventas diarias** por sucursal con comparación POS vs Sin IVA
- **Reportes** exportables a CSV con filtros por fecha y sucursal
- **Dashboard** administrativo con KPIs y gráficas
- **Registro biométrico** con consentimiento (face-api.js compatible)
- **Auditoría** completa de acciones administrativas

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Next.js API Routes |
| Base de datos | PostgreSQL + Prisma 7 |
| Autenticación | NextAuth.js v4 |
| Gráficas | Recharts |
| Reconocimiento facial | face-api.js |
| Geolocalización | Browser Geolocation API |

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+

### 1. Clonar y configurar

```bash
git clone <repo>
cd CHAMPIONCOAT-SUCURSALES-0705
npm install
```

### 2. Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/championcoat"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="una-clave-secreta-muy-larga-y-aleatoria"
```

### 3. Base de datos

```bash
# Crear migraciones e inicializar la base de datos
npx prisma migrate dev --name init

# Cargar datos de prueba (usuarios y sucursal de ejemplo)
npm run db:seed
```

### 4. Iniciar servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 👥 Usuarios de prueba

Después del seed, tendrás disponibles:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@championcoat.mx | Admin123! | Administrador |
| gerente@championcoat.mx | Gerente123! | Gerente |
| empleado@championcoat.mx | Empleado123! | Empleado |

## 📱 Módulos

### Dashboard
- KPIs del día (empleados, retardos, faltas, ventas)
- Gráfica de ventas por sucursal
- Tabla de asistencia en tiempo real

### Empleados (`/employees`)
- CRUD completo de empleados
- Asignación a sucursal
- Horario personalizado
- Consentimiento para reconocimiento facial

### Sucursales (`/branches`)
- CRUD de sucursales
- Coordenadas GPS
- Radio de geocerca (metros)
- Horario y tolerancia de retardo

### Asistencia (`/attendance`)
- Vista de registros con filtros
- Estados visuales por color

### Check-in (`/checkin`)
- Botón grande de Check-in / Check-out
- Activación de cámara con overlay facial
- Detección de ubicación GPS
- Retroalimentación visual en tiempo real

### Ventas (`/sales`)
- Captura de ventas diarias (POS y sin IVA)
- Historial editable

### Reportes (`/reports`)
- Reporte de asistencia por rango de fechas
- Reporte de ventas
- Exportación CSV

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Sesiones JWT firmadas
- Middleware de protección de rutas por rol
- Datos biométricos tratados como descriptores (embeddings) no imágenes
- Consentimiento requerido para registro facial
- Logs de auditoría de todas las acciones administrativas

## 🗄️ Modelos de base de datos

```
User → Employee → Branch
                → FaceProfile
                → AttendanceRecord
                → DailySales
Branch → AttendanceSettings
User → AuditLog
```

## 📐 Arquitectura

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/           # Layout con sidebar
│   │   ├── admin/             # Dashboard principal
│   │   ├── employees/         # Gestión empleados
│   │   ├── branches/          # Gestión sucursales
│   │   ├── attendance/        # Asistencia
│   │   ├── sales/             # Ventas diarias
│   │   └── reports/           # Reportes
│   ├── checkin/               # Check-in/out empleado
│   └── api/                   # API Routes
│       ├── auth/              # NextAuth
│       ├── attendance/        # Check-in, Check-out
│       ├── branches/          # CRUD sucursales
│       ├── employees/         # CRUD empleados + facial
│       ├── sales/             # Ventas
│       ├── reports/           # Reportes
│       └── dashboard/         # Datos del dashboard
├── components/
│   └── Sidebar.tsx            # Navegación lateral
├── lib/
│   ├── prisma.ts              # Cliente Prisma
│   ├── auth.ts                # Configuración NextAuth
│   ├── session.ts             # Helpers de sesión
│   └── utils.ts               # Haversine, fechas, etc.
├── middleware.ts               # Protección de rutas
prisma/
├── schema.prisma              # Modelos de base de datos
└── seed.ts                    # Datos de prueba
```
