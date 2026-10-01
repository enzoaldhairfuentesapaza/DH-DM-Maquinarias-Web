export const sections: Record<string,string> = {bienvenida:'Bienvenida',novedades:'Novedades',blog:'Blog',promociones:'Promociones',maquinaria:'Catálogo de maquinaria',repuestos:'Repuestos',categorias:'Categorías',ventas:'Ventas / boletas',cotizaciones:'Cotizaciones de repuestos',calculadora:'Calculadora e historial',contactos:'Mensajes de contacto',estadisticas:'Estadísticas',sugerencias:'Sugerencias y reclamos',excel:'Importar y exportar Excel',accesos:'Administrar accesos',configuracion:'Números y correo',auditoria:'Auditoría',papelera:'Papelera',cotizaciones_maquinaria:'Cotizaciones de maquinaria'};
export function routePermission(path: string): string {
 const p=path.split('?')[0].replace(/\/$/,'');
 if(p.includes('papelera'))return 'papelera';
 if(p==='/admin'||p==='/admin/productos'||p==='/admin/vista-previa')return 'hub';
 const part=p.split('/')[2];
 return ({'ventas-cotizaciones':'cotizaciones', 'productos':'categorias','calculadora':'calculadora'} as Record<string,string>)[part]??part;
}
