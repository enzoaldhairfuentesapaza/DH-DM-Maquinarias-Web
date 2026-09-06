<?php
require_once __DIR__ . '/helpers.php';

/**
 * Config de cada tabla editable: nombre de tabla, columnas permitidas,
 * y cuales son JSON (arrays) o booleanas, para serializar/deserializar bien.
 */
function entity_definitions(): array
{
    return [
        'novedades' => [
            'table' => 'novedades',
            'columns' => ['titulo', 'categoria', 'fecha', 'resumen', 'imagen'],
            'json_columns' => [],
            'bool_columns' => [],
            'public_read' => true,
        ],
        'blog' => [
            'table' => 'blog_posts',
            'columns' => ['titulo', 'categoria', 'fecha', 'resumen', 'contenido', 'imagen', 'destacado'],
            'json_columns' => ['contenido'],
            'bool_columns' => ['destacado'],
            'public_read' => true,
        ],
        'promociones' => [
            'table' => 'promociones',
            'columns' => ['titulo', 'descripcion', 'vigencia', 'imagen', 'destacado'],
            'json_columns' => [],
            'bool_columns' => ['destacado'],
            'public_read' => true,
        ],
        'maquinaria' => [
            'table' => 'maquinarias',
            'columns' => [
                'nombre', 'marca', 'categoria', 'anio', 'condicion', 'potencia',
                'peso', 'ubicacion', 'descripcion', 'especificaciones', 'imagen', 'destacado',
                'stock_disponible', 'stock_cantidad',
            ],
            'json_columns' => ['especificaciones'],
            'bool_columns' => ['destacado', 'stock_disponible'],
            'public_read' => true,
        ],
        'repuestos' => [
            'table' => 'repuestos',
            'columns' => [
                'codigo', 'marca', 'marca_detalle', 'nombre', 'especificaciones', 'categoria',
                'descripcion', 'unidad', 'modelo_recomendado', 'codigo_original', 'imagen',
                'stock_disponible', 'stock_cantidad',
            ],
            'json_columns' => ['modelo_recomendado'],
            'bool_columns' => ['stock_disponible'],
            'public_read' => true,
        ],
        'ventas' => [
            'table' => 'ventas',
            'columns' => [
                'numero_boleta', 'cliente_nombre', 'cliente_documento', 'cliente_email',
                'cliente_telefono', 'productos', 'subtotal', 'igv', 'total', 'metodo_pago',
                'estado', 'fecha', 'notas',
            ],
            'json_columns' => ['productos'],
            'bool_columns' => [],
            'public_read' => false, // datos sensibles: solo admin/owner
        ],
    ];
}

function row_out(array $row, array $def): array
{
    foreach ($def['json_columns'] as $col) {
        $row[$col] = json_decode($row[$col] ?? '[]', true) ?? [];
    }
    foreach ($def['bool_columns'] as $col) {
        $row[$col] = (bool) ($row[$col] ?? false);
    }
    // (creado_en / actualizado_en se conservan para poder ordenar/filtrar por fecha en el panel)
    return $row;
}

function crud_handle(string $entityKey, string $method, ?string $id): void
{
    $defs = entity_definitions();
    if (!isset($defs[$entityKey])) {
        json_error('Seccion no encontrada', 404);
    }
    $def = $defs[$entityKey];
    $table = $def['table'];
    $pdo = db();

    if ($method === 'GET' && $id === null) {
        if (!$def['public_read']) {
            require_admin_or_owner();
        }
        $rows = $pdo->query("SELECT * FROM {$table} ORDER BY id DESC")->fetchAll();
        json_response(array_map(fn($r) => row_out($r, $def), $rows));
    }

    if ($method === 'GET' && $id !== null) {
        if (!$def['public_read']) {
            require_admin_or_owner();
        }
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrado', 404);
        json_response(row_out($row, $def));
    }

    if ($method === 'POST') {
        require_admin_or_owner();
        $body = get_json_body();
        $values = [];
        foreach ($def['columns'] as $col) {
            $val = $body[$col] ?? null;
            if (in_array($col, $def['json_columns'], true)) {
                $val = json_encode($val ?? [], JSON_UNESCAPED_UNICODE);
            } elseif (in_array($col, $def['bool_columns'], true)) {
                $val = to_bool($val);
            }
            $values[$col] = $val;
        }
        $cols = implode(', ', array_keys($values));
        $placeholders = implode(', ', array_fill(0, count($values), '?'));
        $stmt = $pdo->prepare("INSERT INTO {$table} ({$cols}) VALUES ({$placeholders})");
        $stmt->execute(array_values($values));
        $newId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$newId]);
        json_response(row_out($stmt->fetch(), $def), 201);
    }

    if ($method === 'PUT') {
        require_admin_or_owner();
        if ($id === null) json_error('Falta el id', 400);
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) json_error('No encontrado', 404);

        $body = get_json_body();
        $values = [];
        foreach ($def['columns'] as $col) {
            $val = $body[$col] ?? null;
            if (in_array($col, $def['json_columns'], true)) {
                $val = json_encode($val ?? [], JSON_UNESCAPED_UNICODE);
            } elseif (in_array($col, $def['bool_columns'], true)) {
                $val = to_bool($val);
            }
            $values[$col] = $val;
        }
        $setClause = implode(', ', array_map(fn($c) => "{$c} = ?", array_keys($values)));
        $params = array_values($values);
        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE {$table} SET {$setClause} WHERE id = ?");
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        json_response(row_out($stmt->fetch(), $def));
    }

    if ($method === 'DELETE') {
        require_admin_or_owner();
        if ($id === null) json_error('Falta el id', 400);
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) json_error('No encontrado', 404);
        $pdo->prepare("DELETE FROM {$table} WHERE id = ?")->execute([$id]);
        json_response(['ok' => true]);
    }

    json_error('Metodo no permitido', 405);
}
