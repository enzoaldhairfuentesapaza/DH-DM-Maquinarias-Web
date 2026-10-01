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
            'columns' => ['titulo', 'categoria', 'fecha', 'resumen', 'imagen', 'destacado'],
            'json_columns' => [],
            'bool_columns' => ['destacado'],
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
                'stock_disponible', 'stock_cantidad', 'destacado',
            ],
            'json_columns' => ['modelo_recomendado'],
            'bool_columns' => ['stock_disponible', 'destacado'],
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

/** Intenta sacar un texto identificable de la fila para el log de auditoria. */
function etiqueta_fila(array $row): string
{
    foreach (['titulo', 'nombre', 'numero_boleta', 'cliente_nombre', 'codigo'] as $campo) {
        if (!empty($row[$campo])) return (string) $row[$campo];
    }
    return '#' . ($row['id'] ?? '?');
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
    if ($id !== null && (!ctype_digit($id) || (int) $id < 1)) json_error('Identificador invalido', 404);
    $table = $def['table'];
    $pdo = db();

    // El rol "cotizador" solo puede tocar la seccion de ventas; el resto del
    // contenido del sitio sigue siendo exclusivo de admin/owner.
    $requireEscritura = $entityKey === 'ventas'
        ? 'require_ventas_access'
        : 'require_admin_or_owner';

    if ($method === 'GET' && $id === null) {
        if (!$def['public_read']) {
            $requireEscritura();
        }
        $rows = $pdo->query("SELECT * FROM {$table} ORDER BY id DESC")->fetchAll();
        json_response(array_map(fn($r) => row_out($r, $def), $rows));
    }

    if ($method === 'GET' && $id !== null) {
        if (!$def['public_read']) {
            $requireEscritura();
        }
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) json_error('No encontrado', 404);
        json_response(row_out($row, $def));
    }

    if ($method === 'POST') {
        $usuarioAuditoria = $requireEscritura();
        $body = get_json_body();
        validate_entity($entityKey, $body, $def, false);
        $values = [];
        foreach ($def['columns'] as $col) {
            if (!array_key_exists($col, $body)) continue;
            $val = $body[$col];
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
        $nuevaFila = $stmt->fetch();
        registrar_auditoria(
            $usuarioAuditoria,
            $entityKey,
            'crear',
            "Creó \"" . etiqueta_fila($nuevaFila) . "\" en {$entityKey}."
        );
        json_response(row_out($nuevaFila, $def), 201);
    }

    if ($method === 'PUT') {
        $usuarioAuditoria = $requireEscritura();
        if ($id === null) json_error('Falta el id', 400);
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) json_error('No encontrado', 404);

        $body = get_json_body();
        validate_entity($entityKey, $body, $def, true);
        $values = [];
        foreach ($def['columns'] as $col) {
            if (!array_key_exists($col, $body)) continue;
            $val = $body[$col];
            if (in_array($col, $def['json_columns'], true)) {
                $val = json_encode($val ?? [], JSON_UNESCAPED_UNICODE);
            } elseif (in_array($col, $def['bool_columns'], true)) {
                $val = to_bool($val);
            }
            $values[$col] = $val;
        }
        if (!$values) json_error('No se enviaron campos para actualizar', 422);
        $setClause = implode(', ', array_map(fn($c) => "{$c} = ?", array_keys($values)));
        $params = array_values($values);
        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE {$table} SET {$setClause} WHERE id = ?");
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        $filaActualizada = $stmt->fetch();
        registrar_auditoria(
            $usuarioAuditoria,
            $entityKey,
            'editar',
            "Editó \"" . etiqueta_fila($filaActualizada) . "\" en {$entityKey}."
        );
        json_response(row_out($filaActualizada, $def));
    }

    if ($method === 'DELETE') {
        $usuarioAuditoria = $requireEscritura();
        if ($id === null) json_error('Falta el id', 400);
        $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);
        $filaAEliminar = $stmt->fetch();
        if (!$filaAEliminar) json_error('No encontrado', 404);
        $pdo->prepare("DELETE FROM {$table} WHERE id = ?")->execute([$id]);
        registrar_auditoria(
            $usuarioAuditoria,
            $entityKey,
            'eliminar',
            "Eliminó \"" . etiqueta_fila($filaAEliminar) . "\" en {$entityKey}."
        );
        json_response(['ok' => true]);
    }

    json_error('Metodo no permitido', 405);
}

function validate_entity(string $key, array &$body, array $def, bool $partial): void
{
    $required = [
        'novedades' => ['titulo', 'categoria', 'fecha', 'resumen'],
        'blog' => ['titulo', 'categoria', 'fecha', 'resumen'],
        'promociones' => ['titulo', 'descripcion', 'vigencia'],
        'maquinaria' => ['nombre', 'marca', 'categoria', 'descripcion'],
        'repuestos' => ['codigo', 'nombre', 'marca', 'categoria', 'descripcion'],
        'ventas' => ['numero_boleta', 'cliente_nombre', 'fecha'],
    ][$key];
    foreach ($required as $field) {
        if (!$partial || array_key_exists($field, $body)) $body[$field] = text_field($body, $field, in_array($field, ['descripcion', 'resumen'], true) ? 20000 : 255, true);
    }
    $limits = ['marca' => 100, 'categoria' => 100, 'fecha' => 50, 'numero_boleta' => 50, 'cliente_nombre' => 150, 'cliente_documento' => 50, 'cliente_telefono' => 50, 'metodo_pago' => 50, 'vigencia' => 100, 'marca_detalle' => 150, 'codigo' => 150, 'codigo_original' => 150, 'unidad' => 50, 'imagen' => 500, 'potencia' => 100, 'peso' => 100, 'ubicacion' => 150, 'notas' => 20000];
    if ($key === 'repuestos') $limits['especificaciones'] = 255;
    foreach ($limits as $field => $max) if (array_key_exists($field, $body)) $body[$field] = text_field($body, $field, $max);
    foreach ($def['json_columns'] as $field) {
        if (!array_key_exists($field, $body)) { if (!$partial) $body[$field] = []; continue; }
        if (!is_array($body[$field]) || !array_is_list($body[$field])) json_error("El campo {$field} debe ser una lista", 422);
        if (in_array($field, ['contenido', 'modelo_recomendado'], true)) {
            foreach ($body[$field] as $value) if (!is_string($value)) json_error("El campo {$field} solo admite texto", 422);
        }
        if ($field === 'especificaciones') {
            foreach ($body[$field] as $value) if (!is_array($value) || !is_string($value['label'] ?? null) || !is_string($value['valor'] ?? null)) json_error('Especificacion invalida', 422);
        }
    }
    foreach (['stock_cantidad', 'anio'] as $field) if (array_key_exists($field, $body)) {
        if ($body[$field] === '' || $body[$field] === null) { $body[$field] = $field === 'stock_cantidad' ? 0 : null; continue; }
        if (!is_numeric($body[$field]) || $body[$field] < 0 || $body[$field] > 2147483647 || floor((float) $body[$field]) != $body[$field]) json_error("El campo {$field} debe ser un entero no negativo", 422);
        $body[$field] = (int) $body[$field];
    }
    foreach (['subtotal', 'igv', 'total'] as $field) if (array_key_exists($field, $body)) {
        if (!is_numeric($body[$field]) || !is_finite((float) $body[$field]) || $body[$field] < 0 || $body[$field] > 9999999999) json_error("El campo {$field} debe ser un monto no negativo", 422);
    }
    if (isset($body['condicion']) && !in_array($body['condicion'], ['Nuevo', 'Usado', 'Reacondicionado'], true)) json_error('Condicion invalida', 422);
    if (isset($body['estado']) && !in_array($body['estado'], ['pagado', 'pendiente', 'anulado'], true)) json_error('Estado invalido', 422);
    if (isset($body['cliente_email'])) $body['cliente_email'] = email_field($body, 'cliente_email', false);
    if (!empty($body['imagen']) && !preg_match('#^(https?://|/(?!/))#', $body['imagen'])) json_error('Ruta de imagen invalida', 422);
}
