<?php
/**
 * Carga a la base de datos el contenido que antes estaba "hardcodeado" en
 * src/data/*.ts (novedades, blog, promociones), ya exportado a JSON en
 * seed_data/*.json. Seguro correrlo varias veces: si la tabla ya tiene
 * datos, no duplica.
 *
 * Correr con: php load_seed_data.php
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function load_json(string $name): array
{
    $path = __DIR__ . '/seed_data/' . $name;
    return json_decode(file_get_contents($path), true) ?? [];
}

$pdo = db();

$count = (int) $pdo->query('SELECT COUNT(*) as c FROM novedades')->fetch()['c'];
if ($count === 0) {
    $stmt = $pdo->prepare(
        'INSERT INTO novedades (titulo, categoria, fecha, resumen, imagen) VALUES (?, ?, ?, ?, ?)'
    );
    foreach (load_json('novedades.json') as $n) {
        $stmt->execute([$n['titulo'], $n['categoria'], $n['fecha'], $n['resumen'], $n['imagen'] ?? null]);
    }
    echo "Novedades cargadas.\n";
} else {
    echo "Novedades ya tenia datos, se omite.\n";
}

$count = (int) $pdo->query('SELECT COUNT(*) as c FROM promociones')->fetch()['c'];
if ($count === 0) {
    $stmt = $pdo->prepare(
        'INSERT INTO promociones (titulo, descripcion, vigencia, imagen, destacado) VALUES (?, ?, ?, ?, ?)'
    );
    foreach (load_json('promociones.json') as $p) {
        $stmt->execute([
            $p['titulo'], $p['descripcion'], $p['vigencia'], $p['imagen'] ?? null,
            !empty($p['destacado']) ? 1 : 0,
        ]);
    }
    echo "Promociones cargadas.\n";
} else {
    echo "Promociones ya tenia datos, se omite.\n";
}

$count = (int) $pdo->query('SELECT COUNT(*) as c FROM blog_posts')->fetch()['c'];
if ($count === 0) {
    $stmt = $pdo->prepare(
        'INSERT INTO blog_posts (titulo, categoria, fecha, resumen, contenido, imagen, destacado)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    foreach (load_json('blog.json') as $b) {
        $stmt->execute([
            $b['titulo'], $b['categoria'], $b['fecha'], $b['resumen'],
            json_encode($b['contenido'] ?? [], JSON_UNESCAPED_UNICODE),
            $b['imagen'] ?? null,
            !empty($b['destacado']) ? 1 : 0,
        ]);
    }
    echo "Blog cargado.\n";
} else {
    echo "Blog ya tenia datos, se omite.\n";
}

$count = (int) $pdo->query('SELECT COUNT(*) as c FROM maquinarias')->fetch()['c'];
if ($count === 0) {
    $stmt = $pdo->prepare(
        'INSERT INTO maquinarias
         (nombre, marca, categoria, anio, condicion, potencia, peso, ubicacion, descripcion, especificaciones, imagen, destacado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach (load_json('maquinaria.json') as $m) {
        $stmt->execute([
            $m['nombre'], $m['marca'], $m['categoria'], $m['año'] ?? $m['anio'] ?? null,
            $m['condicion'] ?? 'Usado', $m['potencia'] ?? null, $m['peso'] ?? null,
            $m['ubicacion'] ?? null, $m['descripcion'],
            json_encode($m['especificaciones'] ?? [], JSON_UNESCAPED_UNICODE),
            $m['imagen'] ?? null, !empty($m['destacado']) ? 1 : 0,
        ]);
    }
    echo "Maquinaria cargada.\n";
} else {
    echo "Maquinaria ya tenia datos, se omite.\n";
}

$count = (int) $pdo->query('SELECT COUNT(*) as c FROM repuestos')->fetch()['c'];
if ($count === 0) {
    $stmt = $pdo->prepare(
        'INSERT INTO repuestos
         (codigo, marca, marca_detalle, nombre, especificaciones, categoria, descripcion, unidad, modelo_recomendado, codigo_original, imagen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach (load_json('repuestos.json') as $r) {
        $stmt->execute([
            $r['codigo'], $r['marca'], $r['marcaDetalle'] ?? null, $r['nombre'],
            $r['especificaciones'] ?? '', $r['categoria'], $r['descripcion'],
            $r['unidad'] ?? 'UNIDADES',
            json_encode($r['modeloRecomendado'] ?? [], JSON_UNESCAPED_UNICODE),
            $r['codigoOriginal'] ?? null, $r['imagen'] ?? null,
        ]);
    }
    echo "Repuestos cargados.\n";
} else {
    echo "Repuestos ya tenia datos, se omite.\n";
}

$count = (int) $pdo->query('SELECT COUNT(*) as c FROM categorias_productos')->fetch()['c'];
if ($count === 0) {
    $stmt = $pdo->prepare('INSERT INTO categorias_productos (tipo, nombre) VALUES (?, ?)');

    // Categorias de maquinaria: las que ya existen en los datos + las tipicas del rubro
    $categoriasMaquinaria = [
        'Excavadoras', 'Cargadores', 'Motoniveladoras', 'Retroexcavadoras',
        'Tractores', 'Volquetes', 'Grúas', 'Compactadoras',
    ];
    foreach (array_unique($categoriasMaquinaria) as $c) {
        $stmt->execute(['maquinaria', $c]);
    }

    // Categorias de repuestos: las que ya existen en los datos actuales +
    // "Replicas a escala" (productos coleccionables tipo miniaturas de maquinaria)
    $categoriasRepuesto = [
        'Bombas', 'Carrocería y Protección', 'Correas y Poleas', 'Filtros', 'Frenos',
        'Kits y Conjuntos', 'Lubricantes y Fluidos', 'Maquinaria Usada', 'Motor',
        'Otros / General', 'Pernos y Sujetadores', 'Resortes', 'Rodamientos y Bujes',
        'Sellos y Empaquetaduras', 'Sistema Eléctrico', 'Sistema Hidráulico',
        'Sistema de Refrigeración', 'Transmisión', 'Tren de Rodaje',
        'Válvulas y Controles', 'Réplicas a escala',
    ];
    foreach (array_unique($categoriasRepuesto) as $c) {
        $stmt->execute(['repuesto', $c]);
    }

    echo "Categorías de productos creadas.\n";
} else {
    echo "Categorías ya tenían datos, se omite.\n";
}
