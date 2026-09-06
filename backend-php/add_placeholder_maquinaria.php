<?php
/**
 * Agrega maquinaria de EJEMPLO/PLACEHOLDER en las categorias que no tenian
 * productos todavia, con fotos de licencia libre (Wikimedia Commons) mientras
 * se completa el inventario real. NO borra ni modifica lo que ya existe.
 *
 * Correr una sola vez visitando esta URL desde el navegador, luego borrar
 * este archivo del servidor.
 *
 * Creditos de fotos (Wikimedia Commons, licencias CC0 / CC-BY-SA):
 * ver el array $items abajo, campo 'credito'.
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function wm(string $filename, int $width = 900): string
{
    return 'https://commons.wikimedia.org/wiki/Special:FilePath/' . rawurlencode($filename) . '?width=' . $width;
}

$items = [
    [
        'nombre' => 'Cargador Frontal de Ruedas (ejemplo)',
        'marca' => 'Caterpillar',
        'categoria' => 'Cargadores',
        'anio' => 2020,
        'condicion' => 'Usado',
        'potencia' => '160 kW (215 HP) aprox.',
        'peso' => '18 000 kg aprox.',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Cargador frontal de ruedas para movimiento de material a gran escala. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Capacidad de cucharón', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Caterpillar 950k Wheel Loader.jpg'),
        'credito' => 'Wikimedia Commons',
    ],
    [
        'nombre' => 'Motoniveladora (ejemplo)',
        'marca' => 'Caterpillar',
        'categoria' => 'Motoniveladoras',
        'anio' => 2019,
        'condicion' => 'Usado',
        'potencia' => '130 kW (175 HP) aprox.',
        'peso' => '14 500 kg aprox.',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Motoniveladora para nivelación y mantenimiento de vías y accesos. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Ancho de cuchilla', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Caterpillar 12G grader MD3.jpg'),
        'credito' => 'Wikimedia Commons',
    ],
    [
        'nombre' => 'Retroexcavadora (ejemplo)',
        'marca' => 'Caterpillar',
        'categoria' => 'Retroexcavadoras',
        'anio' => 2018,
        'condicion' => 'Usado',
        'potencia' => '70 kW (94 HP) aprox.',
        'peso' => '8 500 kg aprox.',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Retroexcavadora versátil para excavación, carga y zanjeo. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Profundidad de excavación', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Caterpillar 908H.JPG'),
        'credito' => 'Wikimedia Commons',
    ],
    [
        'nombre' => 'Tractor de Orugas (ejemplo)',
        'marca' => 'Caterpillar',
        'categoria' => 'Tractores',
        'anio' => 2017,
        'condicion' => 'Usado',
        'potencia' => '150 kW (200 HP) aprox.',
        'peso' => '20 000 kg aprox.',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Tractor de orugas (bulldozer) para movimiento de tierra pesado. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Ancho de cuchilla', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Caterpillar D4C bulldozer.jpg'),
        'credito' => 'Wikimedia Commons',
    ],
    [
        'nombre' => 'Volquete Minero (ejemplo)',
        'marca' => 'Caterpillar',
        'categoria' => 'Volquetes',
        'anio' => 2016,
        'condicion' => 'Usado',
        'potencia' => '300 kW (400 HP) aprox.',
        'peso' => '35 000 kg aprox.',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Camión volquete para acarreo de material en mina y cantera. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Capacidad de carga', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Caterpillar 769D p1.JPG'),
        'credito' => 'Wikimedia Commons (dominio público / CC0)',
    ],
    [
        'nombre' => 'Grúa Móvil (ejemplo)',
        'marca' => 'Genérica',
        'categoria' => 'Grúas',
        'anio' => 2015,
        'condicion' => 'Usado',
        'potencia' => 'Consultar',
        'peso' => 'Consultar',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Grúa móvil para izaje y montaje en obra. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Capacidad de izaje', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Mobile crane.jpg'),
        'credito' => 'Wikimedia Commons',
    ],
    [
        'nombre' => 'Rodillo Compactador (ejemplo)',
        'marca' => 'Caterpillar',
        'categoria' => 'Compactadoras',
        'anio' => 2019,
        'condicion' => 'Usado',
        'potencia' => '100 kW (135 HP) aprox.',
        'peso' => '12 000 kg aprox.',
        'ubicacion' => 'Juliaca, Puno',
        'descripcion' => 'Rodillo compactador para trabajos de compactación de suelo y pavimento. Ficha de ejemplo mientras se completa el inventario real — contáctanos para confirmar disponibilidad y specs exactas.',
        'especificaciones' => [
            ['label' => 'Ancho de rodillo', 'valor' => 'Consultar'],
            ['label' => 'Estado', 'valor' => 'Ficha de ejemplo'],
        ],
        'imagen' => wm('Caterpillar 825G Soil Compactor.jpg'),
        'credito' => 'Wikimedia Commons',
    ],
];

$pdo = db();
$stmt = $pdo->prepare(
    'INSERT INTO maquinarias
     (nombre, marca, categoria, anio, condicion, potencia, peso, ubicacion, descripcion, especificaciones, imagen, destacado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)'
);

$agregados = 0;
foreach ($items as $it) {
    // Evita duplicar si ya se corrio este script antes
    $check = $pdo->prepare('SELECT id FROM maquinarias WHERE nombre = ?');
    $check->execute([$it['nombre']]);
    if ($check->fetch()) {
        continue;
    }
    $stmt->execute([
        $it['nombre'], $it['marca'], $it['categoria'], $it['anio'], $it['condicion'],
        $it['potencia'], $it['peso'], $it['ubicacion'], $it['descripcion'],
        json_encode($it['especificaciones'], JSON_UNESCAPED_UNICODE),
        $it['imagen'],
    ]);
    $agregados++;
}

echo "Listo. Se agregaron {$agregados} productos de ejemplo (de " . count($items) . " posibles; los demas ya existian).\n";
echo "Recuerda: son fichas de EJEMPLO con datos genericos, reemplazalas por tu inventario real desde el panel cuando este listo.\n";
