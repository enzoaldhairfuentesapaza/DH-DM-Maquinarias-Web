-- Respaldar la base ANTES de importar; seleccionar la base correcta.
-- Ejecuta este script UNA VEZ en phpMyAdmin (Webuzo/cPanel) sobre tu base de
-- datos MySQL vacia, antes de subir el backend a produccion.

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    rol ENUM('cliente','admin','owner','cotizador') NOT NULL DEFAULT 'cliente',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    token_version INT NOT NULL DEFAULT 0,
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
    destacado TINYINT(1) NOT NULL DEFAULT 0,
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
    archivo_respuesta VARCHAR(500) DEFAULT NULL,
    canal_respuesta VARCHAR(60) DEFAULT NULL,
    mostrar_en_pagina TINYINT(1) NOT NULL DEFAULT 0,
    origen VARCHAR(50) NOT NULL DEFAULT 'web',
    usuario_id INT DEFAULT NULL,
    eliminado_en DATETIME DEFAULT NULL,
    eliminado_por INT DEFAULT NULL,
    eliminado_por_nombre VARCHAR(150) DEFAULT NULL,
    motivo_eliminacion TEXT DEFAULT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Registro general de auditoria: quien hizo que cambio, en que seccion.
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    usuario_nombre VARCHAR(150) DEFAULT NULL,
    usuario_rol VARCHAR(30) DEFAULT NULL,
    categoria VARCHAR(60) NOT NULL,
    accion VARCHAR(30) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cotizacion_id INT DEFAULT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'cotizacion',
    mensaje TEXT NOT NULL,
    leida TINYINT(1) NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (usuario_id)
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
    destacado TINYINT(1) NOT NULL DEFAULT 0,
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
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_tipo_nombre (tipo, nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configuracion general del sitio (numeros de contacto, correos, etc.) que
-- los admins/owners pueden editar desde "Editar Pagina" sin tocar codigo.
CREATE TABLE IF NOT EXISTS configuracion_sitio (
    clave VARCHAR(80) PRIMARY KEY,
    valor VARCHAR(255) NOT NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sugerencias y reclamos enviados desde el globo flotante del sitio publico.
-- Solo admins/owners pueden verlos (endpoint protegido).
CREATE TABLE IF NOT EXISTS sugerencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('sugerencia','reclamo') NOT NULL DEFAULT 'sugerencia',
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) DEFAULT NULL,
    mensaje TEXT NOT NULL,
    leido TINYINT(1) NOT NULL DEFAULT 0,
    usuario_id INT DEFAULT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rate_limits (
    bucket VARCHAR(64) PRIMARY KEY,
    hits INT NOT NULL DEFAULT 1,
    expires_at BIGINT NOT NULL,
    INDEX (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'nombre') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN nombre VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'email') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN email VARCHAR(150) NOT NULL UNIQUE');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'hashed_password') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN hashed_password VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'rol') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN rol ENUM(''cliente'',''admin'',''owner'',''cotizador'') NOT NULL DEFAULT ''cliente''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'activo') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'token_version') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN token_version INT NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'telefono') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(30) NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'tipo_documento') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN tipo_documento ENUM(''dni'',''ruc'') NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'numero_documento') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN numero_documento VARCHAR(20) NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'razon_social') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN razon_social VARCHAR(200) NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE usuarios ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'titulo') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN titulo VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'categoria') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN categoria VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'fecha') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN fecha VARCHAR(50) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'resumen') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN resumen TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'imagen') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN imagen VARCHAR(500) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'destacado') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE novedades ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'titulo') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN titulo VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'categoria') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN categoria VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'fecha') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN fecha VARCHAR(50) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'resumen') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN resumen TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'contenido') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN contenido JSON NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'imagen') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN imagen VARCHAR(500) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'destacado') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE blog_posts ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'titulo') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN titulo VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'descripcion') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN descripcion TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'vigencia') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN vigencia VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'imagen') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN imagen VARCHAR(500) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'destacado') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promociones' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE promociones ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'nombre_cliente') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN nombre_cliente VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'email_cliente') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN email_cliente VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'telefono_cliente') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN telefono_cliente VARCHAR(50) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'empresa') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN empresa VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'detalle') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN detalle JSON NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'estado') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN estado ENUM(''pendiente'',''respondida'',''denegada'') NOT NULL DEFAULT ''pendiente''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'respuesta') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN respuesta TEXT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'motivo_denegacion') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN motivo_denegacion TEXT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'archivo_respuesta') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN archivo_respuesta VARCHAR(500) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'canal_respuesta') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN canal_respuesta VARCHAR(60) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'mostrar_en_pagina') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN mostrar_en_pagina TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'origen') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN origen VARCHAR(50) NOT NULL DEFAULT ''web''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'usuario_id') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN usuario_id INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'eliminado_en') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN eliminado_en DATETIME DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'eliminado_por') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN eliminado_por INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'eliminado_por_nombre') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN eliminado_por_nombre VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'motivo_eliminacion') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN motivo_eliminacion TEXT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'usuario_id') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN usuario_id INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'usuario_nombre') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN usuario_nombre VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'usuario_rol') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN usuario_rol VARCHAR(30) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'categoria') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN categoria VARCHAR(60) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'accion') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN accion VARCHAR(30) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'descripcion') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN descripcion VARCHAR(500) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auditoria' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE auditoria ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'usuario_id') > 0, 'SELECT 1', 'ALTER TABLE notificaciones ADD COLUMN usuario_id INT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'cotizacion_id') > 0, 'SELECT 1', 'ALTER TABLE notificaciones ADD COLUMN cotizacion_id INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'tipo') > 0, 'SELECT 1', 'ALTER TABLE notificaciones ADD COLUMN tipo VARCHAR(30) NOT NULL DEFAULT ''cotizacion''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'mensaje') > 0, 'SELECT 1', 'ALTER TABLE notificaciones ADD COLUMN mensaje TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'leida') > 0, 'SELECT 1', 'ALTER TABLE notificaciones ADD COLUMN leida TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE notificaciones ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'nombre') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN nombre VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'marca') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN marca VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'categoria') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN categoria VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'anio') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN anio INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'condicion') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN condicion ENUM(''Nuevo'',''Usado'',''Reacondicionado'') NOT NULL DEFAULT ''Usado''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'potencia') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN potencia VARCHAR(100) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'peso') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN peso VARCHAR(100) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'ubicacion') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN ubicacion VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'descripcion') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN descripcion TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'especificaciones') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN especificaciones JSON NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'imagen') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN imagen VARCHAR(500) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'destacado') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'stock_disponible') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN stock_disponible TINYINT(1) NOT NULL DEFAULT 1');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'stock_cantidad') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN stock_cantidad INT NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinarias' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE maquinarias ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'codigo') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN codigo VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'marca') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN marca VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'marca_detalle') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN marca_detalle VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'nombre') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN nombre VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'especificaciones') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN especificaciones VARCHAR(255) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'categoria') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN categoria VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'descripcion') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN descripcion TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'unidad') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN unidad VARCHAR(50) DEFAULT ''UNIDADES''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'modelo_recomendado') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN modelo_recomendado JSON NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'codigo_original') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN codigo_original VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'imagen') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN imagen VARCHAR(500) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'stock_disponible') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN stock_disponible TINYINT(1) NOT NULL DEFAULT 1');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'stock_cantidad') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN stock_cantidad INT NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'destacado') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE repuestos ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'numero_boleta') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN numero_boleta VARCHAR(50) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'cliente_nombre') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN cliente_nombre VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'cliente_documento') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN cliente_documento VARCHAR(50) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'cliente_email') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN cliente_email VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'cliente_telefono') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN cliente_telefono VARCHAR(50) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'productos') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN productos JSON NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'subtotal') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'igv') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN igv DECIMAL(12,2) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'total') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN total DECIMAL(12,2) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'metodo_pago') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN metodo_pago VARCHAR(50) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'estado') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN estado ENUM(''pagado'',''pendiente'',''anulado'') NOT NULL DEFAULT ''pagado''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'fecha') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN fecha VARCHAR(50) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'notas') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN notas TEXT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE ventas ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'numero') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN numero VARCHAR(50) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'cliente_nombre') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN cliente_nombre VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'cliente_documento') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN cliente_documento VARCHAR(50) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'cliente_direccion') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN cliente_direccion VARCHAR(255) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'items') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN items JSON NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'tipo_cambio') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN tipo_cambio DECIMAL(6,3) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'moneda_mostrar') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN moneda_mostrar ENUM(''PEN'',''USD'') NOT NULL DEFAULT ''PEN''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'total') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN total DECIMAL(12,2) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'usuario_id') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN usuario_id INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones_formales' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE cotizaciones_formales ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categorias_productos' AND COLUMN_NAME = 'tipo') > 0, 'SELECT 1', 'ALTER TABLE categorias_productos ADD COLUMN tipo ENUM(''maquinaria'',''repuesto'') NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categorias_productos' AND COLUMN_NAME = 'nombre') > 0, 'SELECT 1', 'ALTER TABLE categorias_productos ADD COLUMN nombre VARCHAR(100) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categorias_productos' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE categorias_productos ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'configuracion_sitio' AND COLUMN_NAME = 'clave') > 0, 'SELECT 1', 'ALTER TABLE configuracion_sitio ADD COLUMN clave VARCHAR(80) PRIMARY KEY');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'configuracion_sitio' AND COLUMN_NAME = 'valor') > 0, 'SELECT 1', 'ALTER TABLE configuracion_sitio ADD COLUMN valor VARCHAR(255) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'configuracion_sitio' AND COLUMN_NAME = 'actualizado_en') > 0, 'SELECT 1', 'ALTER TABLE configuracion_sitio ADD COLUMN actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'tipo') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN tipo ENUM(''sugerencia'',''reclamo'') NOT NULL DEFAULT ''sugerencia''');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'nombre') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN nombre VARCHAR(150) NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'correo') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN correo VARCHAR(150) DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'mensaje') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN mensaje TEXT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'leido') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN leido TINYINT(1) NOT NULL DEFAULT 0');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'usuario_id') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN usuario_id INT DEFAULT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sugerencias' AND COLUMN_NAME = 'creado_en') > 0, 'SELECT 1', 'ALTER TABLE sugerencias ADD COLUMN creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_limits' AND COLUMN_NAME = 'bucket') > 0, 'SELECT 1', 'ALTER TABLE rate_limits ADD COLUMN bucket VARCHAR(64) PRIMARY KEY');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_limits' AND COLUMN_NAME = 'hits') > 0, 'SELECT 1', 'ALTER TABLE rate_limits ADD COLUMN hits INT NOT NULL DEFAULT 1');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
SET @hdm_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_limits' AND COLUMN_NAME = 'expires_at') > 0, 'SELECT 1', 'ALTER TABLE rate_limits ADD COLUMN expires_at BIGINT NOT NULL');
PREPARE hdm_stmt FROM @hdm_sql; EXECUTE hdm_stmt; DEALLOCATE PREPARE hdm_stmt;
ALTER TABLE usuarios MODIFY rol ENUM('cliente','admin','owner','cotizador') NOT NULL DEFAULT 'cliente';
ALTER TABLE cotizaciones MODIFY canal_respuesta VARCHAR(60) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS bienvenida (
    id INT PRIMARY KEY,
    datos TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
