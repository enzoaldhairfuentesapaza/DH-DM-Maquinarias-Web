<?php
/** Count distinct requests per product; quote history and contacts are not inputs. */
function product_quote_rankings(array $details, array $catalogues): array
{
    $normalize=fn($name)=>strtolower(preg_replace('/\s+/u',' ',trim((string)$name)));
    $lookup=[];
    foreach($catalogues as $type=>$rows){
        foreach($rows as $row){
            $lookup[$type]['id'][(int)$row['id']]=$row;
            if(!empty($row['codigo']))$lookup[$type]['code'][$normalize($row['codigo'])]=$row;
            $lookup[$type]['name'][$normalize($row['nombre'])][]=$row;
        }
    }
    $counts=[];
    foreach($details as $row){
        $detail=is_array($row['detalle'])?$row['detalle']:(json_decode($row['detalle']??'{}',true)?:[]);
        $products=$detail['productos']??$detail['calculadora']['items']??[];
        if(!is_array($products))continue;
        $seen=[];
        foreach($products as $p){
            if(!is_array($p))continue;
            $type=($p['tipo']??'')==='maquinaria'?'maquinaria':'repuesto';
            $id=(int)($p['id']??$p['product_id']??0);
            $code=trim((string)($p['codigo']??$p['code']??''));
            $name=trim((string)($p['nombre']??$p['desc']??''));
            if($name==='')continue;
            $match=$id?($lookup[$type]['id'][$id]??null):null;
            if(!$id && $code!=='')$match=$lookup[$type]['code'][$normalize($code)]??null;
            if(!$id && !$match && $code===''){
                $matches=$lookup[$type]['name'][$normalize($name)]??[];
                if(count($matches)===1)$match=$matches[0];
            }
            if($match){$id=(int)$match['id'];$name=$match['nombre'];$code=$match['codigo']??$code;}
            $identity=$type.'|'.($id?'id:'.$id:($code!==''?'code:'.$normalize($code):'name:'.$normalize($name)));
            if(!isset($counts[$identity]))$counts[$identity]=['tipo'=>$type,'producto_id'=>$id?:null,'codigo'=>$code,'nombre'=>$name,'unidades'=>0,'solicitudes'=>0];
            $qty=(float)($p['cantidad']??$p['qty']??1);
            if(!is_finite($qty)||$qty<=0)continue;
            $counts[$identity]['unidades']+=$qty;
            if(!isset($seen[$identity])){$counts[$identity]['solicitudes']++;$seen[$identity]=true;}
        }
    }
    $result=[];
    foreach(['repuesto','maquinaria'] as $type){
        $rows=array_values(array_filter($counts,fn($r)=>$r['tipo']===$type && $r['solicitudes']>0));
        usort($rows,fn($a,$b)=>($b['solicitudes']<=>$a['solicitudes'])?:($b['unidades']<=>$a['unidades'])?:strnatcasecmp($a['nombre'],$b['nombre'])?:strcmp($a['codigo'],$b['codigo']));
        $result[$type]=$rows;
    }
    return $result;
}
