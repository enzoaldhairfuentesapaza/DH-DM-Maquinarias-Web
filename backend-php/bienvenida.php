<?php
function bienvenida_defaults(): array {
    return ['tag'=>'Repuestos y maquinaria pesada','titulo_antes'=>'Maquinaria pesada y','titulo_destacado'=>'repuestos originales','titulo_despues'=>'en un solo lugar','descripcion'=>'Más de 10 años abasteciendo a la construcción, transporte e industria, vendiendo tanto maquinaria pesada como los repuestos que la mantienen funcionando, con stock permanente y atención técnica especializada.','imagen'=>'/hero.png','boton_repuestos'=>'Ver catálogo de repuestos','boton_repuestos_url'=>'/repuestos','boton_maquinaria'=>'Ver catálogo de maquinaria','boton_maquinaria_url'=>'/maquinaria','despachos_valor'=>'+2000','despachos_label'=>'Despachos anuales','stock_valor'=>'+5000','stock_label'=>'Repuestos en stock','garantia_valor'=>'100%','garantia_label'=>'Garantía de calidad'];
}
function bienvenida_handle(string $method): void {
    if ($method==='GET') {
        $stmt=db()->query('SELECT datos FROM bienvenida WHERE id = 1');
        $datos=$stmt->fetchColumn();
        json_response(array_replace(bienvenida_defaults(),$datos?json_decode($datos,true):[]));
    }
    if ($method==='PUT') {
        $user=require_admin_or_owner();$body=get_json_body();$values=[];
        foreach (bienvenida_defaults() as $key=>$default) $values[$key]=text_field($body,$key,$key==='descripcion'?3000:($key==='imagen'?500:200),$key!=='imagen');
        if ($values['imagen']!==null && $values['imagen']!=='' && !preg_match('#^(https?://|/(?!/))#',$values['imagen'])) json_error('Ruta de imagen invalida',422);
        foreach (['boton_repuestos_url','boton_maquinaria_url'] as $key) if (!preg_match('#^/(?!/)[a-zA-Z0-9/._?=&%\-]*$#',$values[$key])) json_error('Los botones deben enlazar a una ruta interna como /repuestos',422);
        $json=json_encode($values,JSON_UNESCAPED_UNICODE);
        $sql=db()->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?'INSERT INTO bienvenida (id, datos) VALUES (1, ?) ON DUPLICATE KEY UPDATE datos = VALUES(datos)':'INSERT INTO bienvenida (id, datos) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET datos = excluded.datos';
        db()->prepare($sql)->execute([$json]);registrar_auditoria($user,'bienvenida','editar','Actualizó la bienvenida del inicio.');json_response($values);
    }
    json_error('Ruta no encontrada',404);
}
