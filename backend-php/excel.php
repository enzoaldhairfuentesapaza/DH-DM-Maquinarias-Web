<?php
/** Excel transports typed rows as JSON. All imports are validated again server-side. */
function excel_definitions(): array
{
    $defs = entity_definitions();
    foreach ($defs as $key => &$def) {
        $def['roles'] = $key === 'ventas' ? ['owner', 'admin', 'cotizador'] : ['owner', 'admin'];
        $def['identity'] = [$key === 'repuestos' ? 'codigo' : ($key === 'ventas' ? 'numero_boleta' : ($key === 'maquinaria' ? 'nombre' : 'titulo'))];
        $def['required'] = [
            'novedades'=>['titulo','categoria','fecha','resumen'], 'blog'=>['titulo','categoria','fecha','resumen'],
            'promociones'=>['titulo','descripcion','vigencia'], 'maquinaria'=>['nombre','marca','categoria','descripcion'],
            'repuestos'=>['codigo','nombre','marca','categoria','descripcion'], 'ventas'=>['numero_boleta','cliente_nombre','fecha']
        ][$key];
    }
    unset($def);
    $extra = [
        'categorias'=>['table'=>'categorias_productos','columns'=>['tipo','nombre'],'required'=>['tipo','nombre'],'identity'=>['tipo','nombre']],
        'accesos'=>['table'=>'usuarios','columns'=>['nombre','email','password','rol','telefono','tipo_documento','numero_documento','razon_social'],'required'=>['nombre','email','password','rol'],'identity'=>['email'],'roles'=>['owner']],
        'cotizaciones'=>['table'=>'cotizaciones','columns'=>['nombre_cliente','email_cliente','telefono_cliente','empresa','detalle','origen'],'required'=>['nombre_cliente','email_cliente','detalle'],'identity'=>['nombre_cliente','email_cliente','detalle'],'json_columns'=>['detalle'],'roles'=>['owner','admin','cotizador'],'where'=>"eliminado_en IS NULL AND origen <> 'contacto'"],
        'contactos'=>['table'=>'cotizaciones','columns'=>[],'readonly'=>true,'json_columns'=>['detalle'],'roles'=>['owner','admin'],'where'=>"eliminado_en IS NULL AND origen = 'contacto'"],
        'cotizador'=>['table'=>'cotizaciones_formales','columns'=>['numero','cliente_nombre','cliente_documento','cliente_direccion','items','tipo_cambio','moneda_mostrar','total'],'required'=>['numero','cliente_nombre','items','total'],'identity'=>['numero'],'json_columns'=>['items'],'roles'=>['owner','admin','cotizador']],
        'sugerencias'=>['table'=>'sugerencias','columns'=>['tipo','nombre','correo','mensaje'],'required'=>['tipo','nombre','mensaje'],'identity'=>['tipo','nombre','correo','mensaje']],
        'configuracion'=>['roles'=>['owner'],'table'=>'configuracion_sitio','columns'=>['clave','valor'],'required'=>['clave','valor'],'identity'=>['clave']],
        'auditoria'=>['table'=>'auditoria','columns'=>[],'roles'=>['owner'],'readonly'=>true],
        'papelera'=>['table'=>'cotizaciones','columns'=>[],'roles'=>['owner'],'readonly'=>true,'where'=>"eliminado_en IS NOT NULL AND origen <> 'contacto'",'json_columns'=>['detalle']],
        'notificaciones'=>['table'=>'notificaciones','columns'=>[],'readonly'=>true,'where'=>'usuario_id = :current_user']
    ];
    foreach ($extra as $key=>$def) $defs[$key] = $def + ['roles'=>['owner','admin'],'json_columns'=>[],'bool_columns'=>[],'required'=>[],'identity'=>[]];
    return $defs;
}
function excel_key($value): string
{
    if (is_array($value)) return json_encode($value, JSON_UNESCAPED_UNICODE);
    return strtolower(preg_replace('/\s+/u',' ',trim(strtr((string)$value, array_combine(
        ['Á','É','Í','Ó','Ú','Ü','Ñ','á','é','í','ó','ú','ü','ñ'], ['a','e','i','o','u','u','n','a','e','i','o','u','u','n'])))));
}
function excel_identity(array $row, array $def): string
{
    return json_encode(array_map(fn($c)=>excel_key($row[$c] ?? ''), $def['identity']));
}
function excel_rows(array $def, array $user): array
{
    $sql = "SELECT * FROM {$def['table']}";
    if (!empty($def['where'])) $sql .= ' WHERE '.$def['where'];
    $stmt=db()->prepare($sql);
    $stmt->execute(str_contains($sql, ':current_user') ? ['current_user'=>$user['id']] : []);
    $rows=array_map(fn($r)=>row_out($r,$def), $stmt->fetchAll());
    if ($def['table']==='cotizaciones' && isset($_GET['tipo'])) {
        $type=$_GET['tipo'];
        $rows=array_values(array_filter($rows,function($row) use ($type) {
            foreach (quote_detail_groups($row['detalle']) as $detail) if (($detail['tipo_solicitud']??'repuesto')===$type) return true;
            return false;
        }));
    }
    if($user['rol']!=='owner' && $def['table']==='cotizaciones')$rows=array_values(array_filter($rows,fn($r)=>!is_machine_quote($r)));
    if($user['rol']!=='owner' && $def['table']==='cotizaciones_formales')$rows=array_values(array_filter($rows,fn($r)=>!machine_history($r)));
    return $rows;
}
function excel_schema(string $key, array $def): array
{
    $numeric=['anio','stock_cantidad','subtotal','igv','total','tipo_cambio'];
    $fields=[];
    foreach ($def['columns'] as $name) $fields[]=['name'=>$name, 'required'=>in_array($name,$def['required'],true),
        'type'=>in_array($name,$def['json_columns'],true)?'json':(in_array($name,$def['bool_columns'],true)?'boolean':(in_array($name,$numeric,true)?'number':'text'))];
    return ['key'=>$key,'importable'=>empty($def['readonly']) && current_user()['rol']!=='cotizador','fields'=>$fields,'identity'=>$def['identity'] ?? [],'updates'=>$key==='configuracion'];
}
function excel_validate(string $key, array &$row, array $def): void
{
    foreach ($row as $field=>$value) if (!in_array($field,$def['columns'],true)) json_error("Columna no permitida: {$field}",422);
    foreach ($def['bool_columns'] as $field) if (isset($row[$field]) && !is_bool($row[$field])) json_error("{$field}: usa Sí o No",422);
    if (isset(entity_definitions()[$key])) { validate_entity($key,$row,$def,false); return; }
    foreach ($def['required'] as $field) if (!isset($row[$field]) || $row[$field]==='') json_error("Falta {$field}",422);
    if ($key==='accesos') {
        validate_account($row); $row['email']=strtolower($row['email']);
        if (!valid_role($row['rol'])) json_error('Rol invalido',422);
        return;
    }
    $limits=['tipo'=>30,'nombre'=>($key==='categorias'?100:150),'correo'=>150,'mensaje'=>5000,'nombre_cliente'=>150,'email_cliente'=>150,'telefono_cliente'=>50,'empresa'=>150,'origen'=>50,'numero'=>50,'cliente_nombre'=>150,'cliente_documento'=>50,'cliente_direccion'=>255,'moneda_mostrar'=>3,'clave'=>80,'valor'=>255];
    foreach ($limits as $field=>$max) if (array_key_exists($field,$row)) $row[$field]=text_field($row,$field,$max,in_array($field,$def['required'],true));
    if ($key==='categorias' && !in_array($row['tipo'],['maquinaria','repuesto'],true)) json_error('tipo: maquinaria o repuesto',422);
    if ($key==='sugerencias') {
        if (!in_array($row['tipo'],['sugerencia','reclamo'],true)) json_error('tipo: sugerencia o reclamo',422);
        if (isset($row['correo'])) $row['correo']=email_field($row,'correo',false);
    }
    if ($key==='cotizaciones') {
        if(current_user()['rol']!=='owner' && is_machine_quote($row))json_error('Solo el owner puede importar cotizaciones de maquinaria',403);
        if(($row['origen']??'')==='contacto')json_error('Los mensajes de contacto pertenecen a su propia bandeja',422);
        $row['email_cliente']=email_field($row,'email_cliente');
        if (!in_array($row['origen']??'web',['web','contacto','pagina','correo','whatsapp'],true)) json_error('Origen invalido',422);
        if (!is_array($row['detalle']) || (array_is_list($row['detalle']) && $row['detalle']!==[])) json_error('detalle debe ser un objeto JSON',422);
        if (isset($_GET['tipo']) && (quote_detail_groups($row['detalle'])[0]['tipo_solicitud']??'repuesto')!==$_GET['tipo']) json_error('La fila corresponde a otro grupo de cotización',422);
        if (count(quote_detail_groups($row['detalle'])) > 1) json_error('Separa maquinaria y repuestos en dos filas de cotización',422);
        $products=$row['detalle']['productos'] ?? [];
        if (!is_array($products) || !array_is_list($products) || count($products)>200) json_error('Productos invalidos',422);
        foreach ($products as $p) if (!is_array($p) || !is_string($p['nombre']??null) || !in_array($p['tipo']??null,['maquinaria','repuesto'],true) || !is_numeric($p['cantidad']??null) || $p['cantidad']<1 || $p['cantidad']>100000 || floor((float)$p['cantidad'])!=$p['cantidad']) json_error('Producto o cantidad invalida',422);
    }
    if ($key==='cotizador') {
        if(current_user()['rol']!=='owner' && machine_history($row))json_error('Solo el owner puede importar cotizaciones de maquinaria',403);
        if (!in_array($row['moneda_mostrar']??'PEN',['PEN','USD'],true)) json_error('Moneda invalida',422);
        if (!is_array($row['items']) || !array_is_list($row['items']) || count($row['items'])===0 || count($row['items'])>200) json_error('items: lista de 1 a 200 productos',422);
        foreach ($row['items'] as $p) if (!is_array($p) || !is_numeric($p['qty']??null) || !is_finite((float)$p['qty']) || $p['qty']<=0 || !is_numeric($p['price']??null) || !is_finite((float)$p['price']) || $p['price']<0) json_error('Cantidad o precio invalido',422);
        foreach (['total','tipo_cambio'] as $field) if (isset($row[$field]) && (!is_numeric($row[$field]) || !is_finite((float)$row[$field]) || $row[$field]<0 || $row[$field]>($field==='total'?9999999999:999.999))) json_error("{$field}: monto invalido",422);
    }
    if ($key==='configuracion') {
        if (!in_array($row['clave'],['whatsapp_primario','whatsapp_secundario','correo_contacto'],true)) json_error('Clave de configuracion no permitida',422);
        if ($row['clave']==='correo_contacto') email_field(['valor'=>$row['valor']],'valor');
        elseif (!preg_match('/^\d{8,15}$/',$row['valor'])) json_error('WhatsApp: 8 a 15 digitos',422);
    }
}
function excel_review(string $key,array $rows,array $def,array $existing,bool $duplicates): array
{
    $identities=[]; $names=[]; $result=[];
    foreach ($existing as $r) {
        $identities[excel_identity($r,$def)]=true;
        $n=excel_key($r['nombre']??$r['titulo']??''); if ($n!=='') $names[$n]=true;
    }
    foreach ($rows as $index=>$row) {
        $entry=['row'=>$index+2,'errors'=>[],'warnings'=>[],'skip'=>false,'data'=>[]];
        $GLOBALS['hdm_excel_validation']=true;
        try {
            if (!is_array($row) || array_is_list($row)) json_error('Fila invalida',422);
            excel_validate($key,$row,$def);
            $identity=excel_identity($row,$def);
            $exists=isset($identities[$identity]);
            if ($exists && $key!=='configuracion') {
                $entry['warnings'][]='Ya existe un registro con la misma clave';
                // Unique database keys cannot be duplicated even if the option is enabled.
                $entry['skip']=!$duplicates || in_array($key,['accesos','categorias'],true);
            }
            if ($exists && $key==='configuracion') $entry['warnings'][]='Se actualizará esta configuración';
            $name=excel_key($row['nombre']??$row['titulo']??'');
            if ($name!=='' && isset($names[$name])) $entry['warnings'][]='Ya existe un registro con el mismo nombre';
            if (!$entry['skip']) { $identities[$identity]=true; if ($name!=='') $names[$name]=true; }
            $entry['data']=$row;
        } catch (InvalidArgumentException $e) { $entry['errors'][]=$e->getMessage(); }
        finally { $GLOBALS['hdm_excel_validation']=false; }
        $result[]=$entry;
    }
    return $result;
}
function excel_handle(array $segments,string $method): void
{
    $user=require_permission('excel'); $defs=excel_definitions();
    if (count($segments)===1 && $method==='GET') {
        $schemas=[]; foreach ($defs as $key=>$def) if (excel_allowed($key,$def,$user)) $schemas[]=excel_schema($key,$def);
        json_response($schemas);
    }
    $key=$segments[1]??''; $action=$segments[2]??'';
    if (!isset($defs[$key]) || count($segments)!==3) json_error('Seccion Excel no encontrada',404);
    $def=$defs[$key]; if(!excel_allowed($key,$def,$user))json_error('No tienes acceso a esta sección Excel',403);
    if($key==='cotizaciones' && ($_GET['tipo']??'')==='maquinaria')require_owner();
    if ($key==='cotizaciones' && isset($_GET['tipo']) && !in_array($_GET['tipo'],['maquinaria','repuesto'],true)) json_error('Grupo de cotizacion invalido',422);
    if ($method==='GET' && $action==='schema') json_response(excel_schema($key,$def));
    if ($method==='GET' && $action==='export') {
        $rows=excel_rows($def,$user);
        if ($key==='accesos') $rows=array_map('sanitize_user',$rows);
        json_response(['schema'=>excel_schema($key,$def),'rows'=>$rows]);
    }
    if ($method!=='POST' || !in_array($action,['preview','import'],true)) json_error('Ruta Excel no encontrada',404);
    if($user['rol']==='cotizador')json_error('El cotizador puede descargar Excel, pero no importar archivos',403);
    if (!empty($def['readonly'])) json_error('Esta tabla es de solo lectura',403);
    $body=get_json_body(); $rows=$body['rows']??null;
    if (!is_array($rows) || !array_is_list($rows) || count($rows)<1 || count($rows)>500) json_error('Envía de 1 a 500 filas por lote',422);
    $duplicates=($body['allow_duplicates']??false)===true;
    $pdo=db();
    // Serialize imports against one another, including identities without UNIQUE constraints.
    $mysqlLock=false;
    if ($action==='import' && $pdo->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql') {
        $stmt=$pdo->prepare('SELECT GET_LOCK(?, 10)'); $stmt->execute(['hdm_excel_'.$key]);
        if ((int)$stmt->fetchColumn()!==1) json_error('Hay otra importación en curso. Intenta nuevamente.',409);
        $mysqlLock=true;
    }
    try {
        if ($action==='import') $pdo->beginTransaction();
        $review=excel_review($key,$rows,$def,excel_rows($def,$user),$duplicates);
        $invalid=array_filter($review,fn($r)=>count($r['errors'])>0);
        if ($action==='preview') {
            // Passwords are write-only and never returned in the review.
            foreach ($review as &$r) unset($r['data']['password']); unset($r);
            json_response(['rows'=>$review]);
        }
        if ($invalid) { $pdo->rollBack(); json_error('El lote tiene filas inválidas. Revisa la vista previa antes de importar.',422); }
        $inserted=0; $skipped=0; $updated=0;
        foreach ($review as $entry) {
            if ($entry['skip']) { $skipped++; continue; }
            $values=$entry['data'];
            foreach ($def['json_columns'] as $c) if (isset($values[$c])) $values[$c]=json_encode($values[$c],JSON_UNESCAPED_UNICODE);
            foreach ($def['bool_columns'] as $c) if (isset($values[$c])) $values[$c]=to_bool($values[$c]);
            if ($key==='accesos') { $values['hashed_password']=hash_password($values['password']); unset($values['password']); }
            if ($key==='cotizador') $values['usuario_id']=$user['id'];
            if ($key==='configuracion') {
                $stmt=$pdo->prepare('SELECT clave FROM configuracion_sitio WHERE clave = ?'); $stmt->execute([$values['clave']]);
                if ($stmt->fetch()) { $pdo->prepare('UPDATE configuracion_sitio SET valor = ? WHERE clave = ?')->execute([$values['valor'],$values['clave']]); $updated++; continue; }
            }
            $cols=implode(', ',array_keys($values)); $marks=implode(', ',array_fill(0,count($values),'?'));
            $pdo->prepare("INSERT INTO {$def['table']} ({$cols}) VALUES ({$marks})")->execute(array_values($values)); $inserted++;
        }
        registrar_auditoria($user,$key,'importar',"Excel: {$inserted} creados, {$updated} actualizados, {$skipped} omitidos.");
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('[HDM Excel] '.$e->getMessage());
        json_error('No se guardó este lote. Comprueba valores y claves únicas; vuelve a revisar el archivo.',409);
    } finally {
        if ($mysqlLock) { $stmt=$pdo->prepare('SELECT RELEASE_LOCK(?)'); $stmt->execute(['hdm_excel_'.$key]); }
    }
    json_response(['inserted'=>$inserted,'updated'=>$updated,'skipped'=>$skipped]);
}

function excel_allowed(string $key,array $def,array $user): bool {
    if(!has_permission($user,'excel'))return false;
    if(isset(builtin_permissions()[$user['rol']]) && !in_array($user['rol'],$def['roles'],true))return false;
    if(in_array($key,['accesos','configuracion','auditoria','papelera'],true))return $user['rol']==='owner';
    $section=['cotizador'=>'calculadora','blog_posts'=>'blog','notificaciones'=>'cotizaciones'][$key]??$key;
    return has_permission($user,$section);
}
