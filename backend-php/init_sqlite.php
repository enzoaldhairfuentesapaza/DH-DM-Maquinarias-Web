<?php
/**
 * Solo para desarrollo local con SQLite. En produccion (MySQL) usa
 * schema.mysql.sql directamente en phpMyAdmin; este archivo no se usa ahi.
 * Ejecutar con: php init_sqlite.php
 */
require __DIR__ . '/db.php';

$pdo = db();

$pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'cliente',
    activo INTEGER NOT NULL DEFAULT 1,
    telefono TEXT,
    tipo_documento TEXT,
    numero_documento TEXT,
    razon_social TEXT,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS novedades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    fecha TEXT NOT NULL,
    resumen TEXT NOT NULL,
    imagen TEXT,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    fecha TEXT NOT NULL,
    resumen TEXT NOT NULL,
    contenido TEXT NOT NULL DEFAULT '[]',
    imagen TEXT,
    destacado INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS promociones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    vigencia TEXT NOT NULL,
    imagen TEXT,
    destacado INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS cotizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_cliente TEXT NOT NULL,
    email_cliente TEXT NOT NULL,
    telefono_cliente TEXT,
    empresa TEXT,
    detalle TEXT NOT NULL DEFAULT '{}',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    respuesta TEXT,
    motivo_denegacion TEXT,
    origen TEXT NOT NULL DEFAULT 'web',
    usuario_id INTEGER,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS maquinarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    marca TEXT NOT NULL,
    categoria TEXT NOT NULL,
    anio INTEGER,
    condicion TEXT NOT NULL DEFAULT 'Usado',
    potencia TEXT,
    peso TEXT,
    ubicacion TEXT,
    descripcion TEXT NOT NULL,
    especificaciones TEXT NOT NULL DEFAULT '[]',
    imagen TEXT,
    destacado INTEGER NOT NULL DEFAULT 0,
    stock_disponible INTEGER NOT NULL DEFAULT 1,
    stock_cantidad INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS repuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL,
    marca TEXT NOT NULL,
    marca_detalle TEXT,
    nombre TEXT NOT NULL,
    especificaciones TEXT,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    unidad TEXT DEFAULT 'UNIDADES',
    modelo_recomendado TEXT NOT NULL DEFAULT '[]',
    codigo_original TEXT,
    imagen TEXT,
    stock_disponible INTEGER NOT NULL DEFAULT 1,
    stock_cantidad INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_boleta TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_documento TEXT,
    cliente_email TEXT,
    cliente_telefono TEXT,
    productos TEXT NOT NULL DEFAULT '[]',
    subtotal REAL NOT NULL DEFAULT 0,
    igv REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    metodo_pago TEXT,
    estado TEXT NOT NULL DEFAULT 'pagado',
    fecha TEXT NOT NULL,
    notas TEXT,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS cotizaciones_formales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_documento TEXT,
    cliente_direccion TEXT,
    items TEXT NOT NULL DEFAULT '[]',
    tipo_cambio REAL,
    moneda_mostrar TEXT NOT NULL DEFAULT 'PEN',
    total REAL NOT NULL DEFAULT 0,
    usuario_id INTEGER,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS categorias_productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

echo "Tablas creadas correctamente en SQLite (hdm.db).\n";
