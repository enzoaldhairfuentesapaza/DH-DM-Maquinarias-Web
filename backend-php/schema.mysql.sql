-- Ejecuta este script UNA VEZ en phpMyAdmin (Webuzo/cPanel) sobre tu base de
-- datos MySQL vacia, antes de subir el backend a produccion.

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    rol ENUM('cliente','admin','owner') NOT NULL DEFAULT 'cliente',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    telefono VARCHAR(30) NULL,
    tipo_documento ENUM('dni','ruc') NULL,
    numero_documento VARCHAR(20) NULL,
    razon_social VARCHAR(200) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS novedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    fecha VARCHAR(50) NOT NULL,
    resumen TEXT NOT NULL,
    imagen VARCHAR(500) DEFAULT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    fecha VARCHAR(50) NOT NULL,
    resumen TEXT NOT NULL,
    contenido JSON NOT NULL,
    imagen VARCHAR(500) DEFAULT NULL,
    destacado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promociones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    vigencia VARCHAR(100) NOT NULL,
    imagen VARCHAR(500) DEFAULT NULL,
    destacado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(150) NOT NULL,
    email_cliente VARCHAR(150) NOT NULL,
    telefono_cliente VARCHAR(50) DEFAULT NULL,
    empresa VARCHAR(150) DEFAULT NULL,
    detalle JSON NOT NULL,
    estado ENUM('pendiente','respondida','denegada') NOT NULL DEFAULT 'pendiente',
    respuesta TEXT DEFAULT NULL,
    motivo_denegacion TEXT DEFAULT NULL,
    origen VARCHAR(50) NOT NULL DEFAULT 'web',
    usuario_id INT DEFAULT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maquinarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    anio INT DEFAULT NULL,
    condicion ENUM('Nuevo','Usado','Reacondicionado') NOT NULL DEFAULT 'Usado',
    potencia VARCHAR(100) DEFAULT NULL,
    peso VARCHAR(100) DEFAULT NULL,
    ubicacion VARCHAR(150) DEFAULT NULL,
    descripcion TEXT NOT NULL,
    especificaciones JSON NOT NULL,
    imagen VARCHAR(500) DEFAULT NULL,
    destacado TINYINT(1) NOT NULL DEFAULT 0,
    stock_disponible TINYINT(1) NOT NULL DEFAULT 1,
    stock_cantidad INT NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repuestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(150) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    marca_detalle VARCHAR(150) DEFAULT NULL,
    nombre VARCHAR(255) NOT NULL,
    especificaciones VARCHAR(255) DEFAULT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    unidad VARCHAR(50) DEFAULT 'UNIDADES',
    modelo_recomendado JSON NOT NULL,
    codigo_original VARCHAR(150) DEFAULT NULL,
    imagen VARCHAR(500) DEFAULT NULL,
    stock_disponible TINYINT(1) NOT NULL DEFAULT 1,
    stock_cantidad INT NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_boleta VARCHAR(50) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_documento VARCHAR(50) DEFAULT NULL,
    cliente_email VARCHAR(150) DEFAULT NULL,
    cliente_telefono VARCHAR(50) DEFAULT NULL,
    productos JSON NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    igv DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50) DEFAULT NULL,
    estado ENUM('pagado','pendiente','anulado') NOT NULL DEFAULT 'pagado',
    fecha VARCHAR(50) NOT NULL,
    notas TEXT DEFAULT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cotizador formal (calculadora de precios con ajustes por marca, descuentos,
-- tipo de cambio y generacion de PDF). Distinto de "cotizaciones", que son
-- solicitudes simples enviadas por clientes/visitantes desde la web.
CREATE TABLE IF NOT EXISTS cotizaciones_formales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_documento VARCHAR(50) DEFAULT NULL,
    cliente_direccion VARCHAR(255) DEFAULT NULL,
    items JSON NOT NULL,
    tipo_cambio DECIMAL(6,3) DEFAULT NULL,
    moneda_mostrar ENUM('PEN','USD') NOT NULL DEFAULT 'PEN',
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    usuario_id INT DEFAULT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categorias configurables para maquinaria y repuestos (para que el panel
-- pueda agregar/editar/quitar secciones como "Replicas a escala").
CREATE TABLE IF NOT EXISTS categorias_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('maquinaria','repuesto') NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
