<?php
if (($segments[0] ?? null) !== 'cotizador') return;
$user = require_permission('calculadora');
$id = $segments[1] ?? null;
if ($method === 'GET') {
    $stmt = $id ? db()->prepare('SELECT * FROM cotizaciones_formales WHERE id = ?') : db()->prepare('SELECT * FROM cotizaciones_formales ORDER BY id DESC');
    $stmt->execute($id ? [$id] : []);
    $rows=$stmt->fetchAll();if($user['rol']!=='owner'){$rows=array_values(array_filter($rows,fn($r)=>!machine_history($r)));}
    if ($id && !$rows) json_error('Cotizacion no encontrada',404);
    foreach ($rows as &$row) {$row['items']=json_decode($row['items'],true)??[];$row['oficial']=(bool)$row['oficial'];}
    json_response($id ? $rows[0] : $rows);
}
if ($method === 'POST' && $id === null) {
    $body=isset($_POST['datos']) ? json_decode($_POST['datos'],true) : get_json_body();
    if (!is_array($body))json_error('Datos invalidos',422);
    $number=text_field($body,'numero',50,true);
    $name=text_field($body,'cliente_nombre',150,true);
    $document=text_field($body,'cliente_documento',50);
    $address=text_field($body,'cliente_direccion',255);
    $email=text_field($body,'cliente_email',150)??'';
    if ($email!=='' && !filter_var($email,FILTER_VALIDATE_EMAIL))json_error('Correo invalido',422);
    $phone=text_field($body,'cliente_telefono',50);
    $key=text_field($body,'registro_clave',80);
    $official=to_bool($body['oficial']??false);
    if($official)require_permission('cotizaciones');
    $currency=$body['moneda_mostrar']??'PEN';
    if(!in_array($currency,['PEN','USD'],true))json_error('Moneda invalida',422);
    $rate=(float)($body['tipo_cambio']??0);
    if(!is_finite($rate) || $rate<0 || $rate>999)json_error('Tipo de cambio invalido',422);
    $items=$body['items']??[];
    if(!is_array($items)||!count($items)||count($items)>200)json_error('Agrega entre 1 y 200 productos',422);
    $total=0;$types=[];
    foreach($items as &$item) {
        if(!is_array($item))json_error('Producto invalido',422);
        foreach(['qty','price'] as $field)if(!is_numeric($item[$field]??null)||!is_finite((float)$item[$field]))json_error('Cantidad o precio invalido',422);
        if($item['qty']<=0||$item['qty']>100000||$item['price']<0||$item['price']>999999999||($official&&$item['price']==0))json_error('Completa cantidades y precios antes del registro oficial',422);
        if(!in_array($item['currency']??'USD',['PEN','USD'],true))json_error('Moneda de producto invalida',422);
        foreach(['code'=>150,'unit'=>50,'brand'=>100,'desc'=>3000] as $field=>$max)$item[$field]=text_field($item,$field,$max,$field==='desc');
        $item['tipo']=($item['tipo']??'repuesto')==='maquinaria'?'maquinaria':'repuesto';$types[$item['tipo']]=true;
        $price=(float)$item['price'];
        foreach(['brandAdjustments','discounts'] as $field) {
            $values=$item[$field]??[];if(!is_array($values)||count($values)>20)json_error('Ajustes invalidos',422);
            foreach($values as $value){if(!is_numeric($value)||$value<0||$value>100)json_error('Porcentaje invalido',422);$price*=($field==='discounts'?1-$value/100:1+$value/100);}
            $item[$field]=$values;
        }
        if(($item['currency']??'USD')!==$currency){if($rate<=0)json_error('Ingresa un tipo de cambio valido',422);$price=$currency==='PEN'?$price*$rate:$price/$rate;}
        $item['precio_final']=floor($price+0.5);$total+=$item['precio_final']*$item['qty'];
    }
    unset($item);
    if(isset($types['maquinaria']))require_owner();
    if(!is_finite($total)||$total>9999999999)json_error('Total fuera de rango',422);
    if($official&&count($types)>1)json_error('Registra maquinaria y repuestos en cotizaciones oficiales separadas',422);
    $source=($body['solicitud_id']??null)?(int)$body['solicitud_id']:null;
    $pdo=db();$sourceRow=null;
    if($source){require_permission('cotizaciones');$q=$pdo->prepare("SELECT * FROM cotizaciones WHERE id=? AND origen <> 'contacto' AND eliminado_en IS NULL");$q->execute([$source]);$sourceRow=$q->fetch();if(!$sourceRow)json_error('Solicitud no encontrada',404);
        if(is_machine_quote($sourceRow))require_owner();
        $groups=quote_detail_groups(json_decode($sourceRow['detalle'],true)??[]);$type=array_key_first($types);if($official&&(count($groups)>1||($groups[0]['tipo_solicitud']??'repuesto')!==$type))json_error('Los productos deben corresponder al tipo de la solicitud',422);
    }
    if($official&&(!isset($_FILES['pdf'])||strtolower(pathinfo($_FILES['pdf']['name'],PATHINFO_EXTENSION))!=='pdf'))json_error('El registro oficial necesita su PDF',422);
    $pdf=null;
    $pdo->beginTransaction();
    try {
        // Serialize saves on the account so retries with the same key do not duplicate history or official requests.
        if($pdo->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'){$q=$pdo->prepare('SELECT id FROM usuarios WHERE id=? FOR UPDATE');$q->execute([$user['id']]);}
        if($key!==''){$q=$pdo->prepare('SELECT * FROM cotizaciones_formales WHERE registro_clave=? AND usuario_id=?');$q->execute([$key,$user['id']]);if($existing=$q->fetch()){$pdo->commit();$existing['items']=json_decode($existing['items'],true);$existing['oficial']=(bool)$existing['oficial'];json_response($existing);}}
        if($official)$pdf=save_upload($_FILES['pdf'],false);
        $officialId=null;
        if($official){
            $details=['productos'=>array_map(fn($i)=>['id'=>$i['product_id']??null,'nombre'=>$i['desc'],'tipo'=>$i['tipo'],'codigo'=>$i['code'],'marca'=>$i['brand'],'cantidad'=>$i['qty'],'precio'=>$i['precio_final']],$items),'tipo_solicitud'=>array_key_first($types),'calculadora'=>['numero'=>$number,'moneda'=>$currency,'total'=>$total],'canal'=>'pagina'];
            if($sourceRow){
                $officialId=$source;$details=json_decode($sourceRow['detalle'],true)??[];$details['calculadora']=['numero'=>$number,'moneda'=>$currency,'total'=>$total,'items'=>$items];
                $q=$pdo->prepare("UPDATE cotizaciones SET detalle=?,estado='respondida',respuesta=?,archivo_respuesta=?,canal_respuesta='pagina',mostrar_en_pagina=? WHERE id=?");$q->execute([json_encode($details,JSON_UNESCAPED_UNICODE),"Cotizacion {$number} · {$currency} {$total}",$pdf,$sourceRow['usuario_id']?1:0,$source]);
                crear_notificacion_cotizacion($sourceRow,'respondida','pagina',(bool)$sourceRow['usuario_id']);
            }else{
                $q=$pdo->prepare("INSERT INTO cotizaciones (nombre_cliente,email_cliente,telefono_cliente,detalle,origen,estado,respuesta,archivo_respuesta,canal_respuesta) VALUES (?,?,?,?,'presencial','respondida',?,?,'pagina')");$q->execute([$name,$email,$phone,json_encode($details,JSON_UNESCAPED_UNICODE),"Cotizacion {$number} · {$currency} {$total}",$pdf]);$officialId=(int)$pdo->lastInsertId();
            }
        }
        $q=$pdo->prepare('INSERT INTO cotizaciones_formales (numero,cliente_nombre,cliente_documento,cliente_direccion,items,tipo_cambio,moneda_mostrar,total,usuario_id,oficial,solicitud_id,cotizacion_id,archivo_pdf,cliente_email,cliente_telefono,registro_clave) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $q->execute([$number,$name,$document,$address,json_encode($items,JSON_UNESCAPED_UNICODE),$rate,$currency,$total,$user['id'],$official?1:0,$source,$officialId,$pdf,$email,$phone,$key?:null]);$newId=$pdo->lastInsertId();
        registrar_auditoria($user,'cotizador','crear',"Guardó {$number}".($official?' como oficial':' en historial de pruebas'));
        $pdo->commit();
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();if($pdf){$file=config()['documents_dir'].'/'.basename($pdf);if(is_file($file))unlink($file);}throw $e;}
    $q=$pdo->prepare('SELECT * FROM cotizaciones_formales WHERE id=?');$q->execute([$newId]);$row=$q->fetch();$row['items']=json_decode($row['items'],true);$row['oficial']=(bool)$row['oficial'];json_response($row,201);
}
if($method==='DELETE'&&$id){
    $q=db()->prepare('SELECT * FROM cotizaciones_formales WHERE id=?');$q->execute([$id]);$row=$q->fetch();if(!$row)json_error('No encontrada',404);
    if(machine_history($row))require_owner();
    if($row['oficial'])json_error('Las cotizaciones oficiales se conservan. Gestiona su solicitud desde el panel',409);
    db()->prepare('DELETE FROM cotizaciones_formales WHERE id=?')->execute([$id]);json_response(['ok'=>true]);
}
json_error('Ruta no encontrada',404);
