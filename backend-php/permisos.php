<?php
/** Section permissions are resolved from the database on each request. */
function permission_sections(): array {
    return ['bienvenida'=>'Bienvenida','novedades'=>'Novedades','blog'=>'Blog','promociones'=>'Promociones','maquinaria'=>'Catálogo de maquinaria','repuestos'=>'Repuestos','categorias'=>'Categorías','ventas'=>'Ventas / boletas','cotizaciones'=>'Cotizaciones de repuestos','calculadora'=>'Calculadora e historial','contactos'=>'Mensajes de contacto','estadisticas'=>'Estadísticas','sugerencias'=>'Sugerencias y reclamos','excel'=>'Importar y exportar Excel'];
}
function builtin_permissions(): array {
    $all=array_keys(permission_sections());
    return ['owner'=>array_merge($all,['accesos','configuracion','auditoria','papelera','cotizaciones_maquinaria']), 'admin'=>$all,'cotizador'=>['ventas','cotizaciones','calculadora','excel'],'cliente'=>[]];
}
function user_permissions(array $user): array {
    $built=builtin_permissions();$role=$user['rol'];
    if(isset($built[$role]))return $built[$role];
    $q=db()->prepare('SELECT permisos FROM roles_panel WHERE clave=?');$q->execute([$role]);
    return array_values(array_intersect(array_keys(permission_sections()),json_decode($q->fetchColumn()?:'[]',true)?:[]));
}
function has_permission(array $user,string $section): bool {return in_array($section,user_permissions($user),true);}
function require_permission(string $section): array {$u=current_user();if(!has_permission($u,$section))json_error('No tienes acceso a esta sección',403);return $u;}
function api_permission(): ?string {
    global $segments;
    $key=$segments[0]??'';
    return ['blog_posts'=>'blog','categorias_productos'=>'categorias','cotizador'=>'calculadora'][$key]??(isset(permission_sections()[$key])?$key:null);
}
function is_machine_quote(array $row): bool {
    $d=is_array($row['detalle']??null)?$row['detalle']:json_decode($row['detalle']??'{}',true);
    if(($d['tipo_solicitud']??'')==='maquinaria')return true;
    foreach($d['productos']??[] as $p)if(($p['tipo']??'')==='maquinaria')return true;
    foreach($d['calculadora']['items']??[] as $p)if(($p['tipo']??'')==='maquinaria')return true;
    return false;
}
function machine_history(array $row): bool {foreach(is_array($row['items'])?$row['items']:(json_decode($row['items'],true)?:[]) as $i)if(($i['tipo']??'')==='maquinaria')return true;return false;}
function roles_handle(array $segments,string $method): void {
    $owner=require_owner();if(count($segments)>2)json_error('Ruta no encontrada',404);$key=$segments[1]??null;
    if($method==='GET'&&$key===null){
        $roles=[];foreach(builtin_permissions() as $name=>$permissions)$roles[]=['clave'=>$name,'nombre'=>ucfirst($name),'permisos'=>$permissions,'sistema'=>true];
        foreach(db()->query('SELECT * FROM roles_panel ORDER BY nombre')->fetchAll() as $r){$r['permisos']=json_decode($r['permisos'],true);$r['sistema']=false;$roles[]=$r;}
        json_response(['roles'=>$roles,'secciones'=>permission_sections(),'reservados'=>['accesos'=>'Administrar accesos','configuracion'=>'Números y correo','auditoria'=>'Auditoría','papelera'=>'Papelera','cotizaciones_maquinaria'=>'Cotizaciones de maquinaria']]);
    }
    if(in_array($method,['POST','PUT'],true)){
        $body=get_json_body();$name=text_field($body,'nombre',80,true);if(in_array(strtolower($name),array_keys(builtin_permissions()),true))json_error('Este nombre está reservado para un rol del sistema',422);$permissions=$body['permisos']??null;
        if(!is_array($permissions)||!array_is_list($permissions)||!count($permissions)||count(array_filter($permissions,'is_string'))!==count($permissions)||array_diff($permissions,array_keys(permission_sections())))json_error('Selecciona secciones válidas. Los permisos del owner son exclusivos.',422);
        $permissions=array_values(array_unique($permissions));
        $dup=db()->prepare('SELECT clave FROM roles_panel WHERE LOWER(nombre)=LOWER(?) AND clave<>?');$dup->execute([$name,$key??'']);if($dup->fetch())json_error('Ya existe un rol con ese nombre',409);
        if($method==='POST'&&$key===null){$key='rol_'.bin2hex(random_bytes(8));db()->prepare('INSERT INTO roles_panel (clave,nombre,permisos) VALUES (?,?,?)')->execute([$key,$name,json_encode($permissions)]);}
        elseif($method==='PUT'&&$key&&!isset(builtin_permissions()[$key])){ $q=db()->prepare('SELECT clave FROM roles_panel WHERE clave=?');$q->execute([$key]);if(!$q->fetch())json_error('Rol no encontrado',404);db()->prepare('UPDATE roles_panel SET nombre=?,permisos=? WHERE clave=?')->execute([$name,json_encode($permissions),$key]);}
        else json_error('Los roles del sistema no se modifican',403);
        registrar_auditoria($owner,'accesos','editar','Guardó el rol '.$name);json_response(['clave'=>$key,'nombre'=>$name,'permisos'=>$permissions,'sistema'=>false],$method==='POST'?201:200);
    }
    if($method==='DELETE'&&$key&&!isset(builtin_permissions()[$key])){
        $q=db()->prepare('SELECT COUNT(*) FROM usuarios WHERE rol=?');$q->execute([$key]);if($q->fetchColumn())json_error('Reasigna los usuarios de este rol antes de eliminarlo',409);
        db()->prepare('DELETE FROM roles_panel WHERE clave=?')->execute([$key]);registrar_auditoria($owner,'accesos','eliminar','Eliminó el rol '.$key);json_response(['ok'=>true]);
    }
    json_error('Ruta no encontrada',404);
}
function valid_role($role): bool {if(!is_string($role)||strlen($role)>80)return false;if(isset(builtin_permissions()[$role]))return true;$q=db()->prepare('SELECT clave FROM roles_panel WHERE clave=?');$q->execute([$role]);return (bool)$q->fetch();}
