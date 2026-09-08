# 🎂 Festy

Plataforma colaborativa de calendario de cumpleaños y galería de fotos por eventos con soporte **Web (Next.js)** y **Móvil Offline-First (Flutter)**, persistencia en **TiDB Cloud Serverless / MySQL 8.0** y almacenamiento multimedia con detección facial inteligente en **Cloudinary**.

---

## 📚 Documentación de Arquitectura y Base de Datos

- **[ARQUITECTURA_FESTY.md](./ARQUITECTURA_FESTY.md)**: Especificación técnica maestra v2.3 (comparativas, tensiones de diseño, máquinas de estado, rate limiting, mitigación de riesgos de menores y flujos de integración).
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**: Diccionario exhaustivo de datos, script DDL SQL completo para TiDB / MySQL 8.0, índices optimizados y consultas clave.

---

## 🏗️ Estructura del Monorepo

```
festy/
├── apps/
│   ├── api/             # Backend Fastify + TypeScript + Drizzle ORM
│   ├── web/             # Frontend Web Next.js 14 (App Router) + Vanilla CSS
│   └── mobile/          # App Móvil Flutter con Drift (SQLite Offline-First)
├── packages/
│   ├── db/              # Esquema Drizzle ORM v2.3, migraciones e índices TiDB
│   └── shared/          # Tipos TypeScript, Enums y Esquemas de validación Zod
├── docker-compose.yml   # Contenedor local MySQL 8.0 + Redis 7
├── DATABASE_SCHEMA.md   # Script DDL e índices
└── ARQUITECTURA_FESTY.md# Especificación de ingeniería
```

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
- **Node.js**: v20 o superior (detectado v22.16.0).
- **Docker**: Para levantar MySQL local y Redis (opcional si usas TiDB Cloud).

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Configura tu cadena de conexión a **TiDB Cloud** o utiliza el contenedor local.

### 3. Levantar Base de Datos y Redis Local (Docker)
```bash
docker compose up -d
```
Esto iniciará:
- MySQL 8.0 en el puerto `4000` (usuario `root`, contraseña `rootpassword`, base `festy_db`).
- Redis en el puerto `6379`.

### 4. Instalar Dependencias
```bash
npm install
```

### 5. Generar y Aplicar Esquema a la Base de Datos
```bash
npm run db:push
```

### 6. Iniciar los Servidores
```bash
# Iniciar API Backend (puerto 4000)
npm run dev:api

# Iniciar Frontend Web (puerto 3000)
npm run dev:web
```
Accede a la web en: `http://localhost:3000`  
Accede al healthcheck de la API en: `http://localhost:4000/health`
