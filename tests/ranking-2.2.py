"""Disposable integration test: never point this at production.
Usage: python tests/ranking-2.2.py
Creates and destroys a temporary SQLite DB by default; PHP CLI is required.
"""
import os, pathlib, subprocess, tempfile, json, urllib.request, urllib.error, time, socket, base64
ROOT=pathlib.Path(__file__).resolve().parents[1]
PHP=os.environ.get('PHP_BIN','php')
passed=[]
def expect(ok,label):
    assert ok,label
    passed.append(label)
def php(script,env):
    return subprocess.run([PHP,str(ROOT/'backend-php'/script)],env=env,check=True,capture_output=True,text=True).stdout
with tempfile.TemporaryDirectory(prefix='hdm-test-') as directory:
    tmp=pathlib.Path(directory)
    cfg=tmp/'config.php'
    cfg.write_text("<?php return "+"['app_env'=>'test','secret_key'=>'integration-test-secret-01234567890123456789','db'=>['driver'=>'sqlite','sqlite_path'=>'"+str(tmp/'test.db')+"'],'uploads_dir'=>'"+str(tmp/'uploads')+"','documents_dir'=>'"+str(tmp/'documents')+"'];")
    env=dict(os.environ,HDM_CONFIG_FILE=str(cfg),OWNER_EMAIL='owner@example.test',OWNER_PASSWORD='TestPassword123!')
    if os.environ.get('HDM_TEST_CONFIG'): env['HDM_CONFIG_FILE']=os.environ['HDM_TEST_CONFIG']
    guard=subprocess.run([PHP,'-r',"require '"+str(ROOT/'backend-php/db.php')+"'; if (config()['app_env'] !== 'test') { fwrite(STDERR, 'Solo se permite una configuracion de pruebas'); exit(1); }"],env=env,check=True,capture_output=True,text=True)
    php('migrate.php',env);php('migrate.php',env);php('seed.php',env)
    with socket.socket() as s: s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    proc=subprocess.Popen([PHP,'-S',f'127.0.0.1:{port}','-t',str(ROOT/'backend-php'),str(ROOT/'backend-php/router.php')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    def call(path,method='GET',data=None,token=None,headers=None):
        body=json.dumps(data).encode() if data is not None and not isinstance(data,bytes) else data
        h={'Content-Type':'application/json',**(headers or {})}
        if token:h['X-Auth-Token']=token
        req=urllib.request.Request(f'http://127.0.0.1:{port}{path}',body,headers=h,method=method)
        try:r=urllib.request.urlopen(req,timeout=5)
        except urllib.error.HTTPError as error:r=error
        raw=r.read()
        try: value=json.loads(raw)
        except (json.JSONDecodeError,UnicodeDecodeError):value=raw
        return r.status,value,r.headers
    def multipart(path,values,token,filename=None,content=b'',field='file'):
        boundary='HDMTestBoundary'
        parts=[]
        for k,v in values.items():parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        if filename:parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{filename}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()+content+b'\r\n')
        parts.append(f'--{boundary}--\r\n'.encode())
        return call(path,'POST',b''.join(parts),token,{'Content-Type':f'multipart/form-data; boundary={boundary}'})
    try:
        for _ in range(50):
            try:call('/api/health');break
            except OSError:time.sleep(.05)
        def login(email):return call('/api/auth/login','POST',{'email':email,'password':'TestPassword123!'})[1]['access_token']
        owner=login('owner@example.test')
        call('/api/accesos','POST',{'nombre':'Admin','email':'admin@example.test','password':'TestPassword123!','rol':'admin'},owner)
        admin=login('admin@example.test')
        call('/api/auth/registro','POST',{'nombre':'Cliente','email':'client@example.test','password':'TestPassword123!'})
        client=login('client@example.test')
        call('/api/accesos','POST',{'nombre':'Cotizador','email':'calc@example.test','password':'TestPassword123!','rol':'cotizador'},owner)
        calc=login('calc@example.test')
        def part(code,name):
            status,row,_=call('/api/repuestos','POST',{'codigo':code,'nombre':name,'marca':'CAT','categoria':'Test','descripcion':'Test'},owner)
            expect(status==201,'create ranking product '+code);return row
        a=part('R-A','Filtro repetido');b=part('R-B','Filtro repetido');c=part('R-C','Producto frecuente')
        def request(products):
            status,row,_=call('/api/cotizaciones','POST',{'nombre_cliente':'Ranking Test','email_cliente':'ranking@example.test','detalle':{'productos':products},'origen':'pagina'})
            expect(status==201,'persist request');return row
        def prod(p,qty=1):return {'id':p['id'],'codigo':p['codigo'],'nombre':p['nombre'],'tipo':'repuesto','cantidad':qty}
        request([prod(a,1),prod(a,2),prod(c)])
        request([prod(a,1),prod(c)])
        request([prod(c)])
        request([prod(b,100)])
        r=call('/api/estadisticas',token=owner)[1]['top_repuestos']
        expect([i['codigo'] for i in r]==['R-C','R-A','R-B'],'ranking uses frequency then units; names do not merge IDs')
        expect(r[1]['solicitudes']==2 and r[1]['unidades']==4,'duplicate lines count once per request and sum units')
        request([{'codigo':'R-C','nombre':c['nombre'],'tipo':'repuesto','cantidad':1}])
        request([{'nombre':c['nombre'],'tipo':'repuesto','cantidad':1}])
        r=call('/api/estadisticas',token=owner)[1]['top_repuestos']
        expect(r[0]['solicitudes']==5,'legacy code and unique name resolve to the same catalogue ID')
        for i in range(10):request([{'nombre':'Otro producto '+str(i),'tipo':'repuesto','cantidad':1}])
        r=call('/api/estadisticas',token=owner)[1]['top_repuestos']
        expect(len(r)==13,'complete ranking includes more than eight products')
        machine={'nombre':'Excavadora Test','tipo':'maquinaria','cantidad':2,'id':999999}
        mq=request([machine]);request([{**machine,'cantidad':1}])
        stats=call('/api/estadisticas',token=owner)[1]
        expect(stats['top_maquinarias'][0]['solicitudes']==2 and stats['top_maquinarias'][0]['unidades']==3,'machine ranking is separate')
        call('/api/contactos','POST',{'nombre_cliente':'Contact Test','email_cliente':'contact@example.test','detalle':{'canal':'pagina','mensaje':'Consulta general','asunto':'Contacto','productos':[prod(c,99)]}})
        expect(call('/api/estadisticas',token=owner)[1]['top_repuestos'][0]['solicitudes']==5,'contact messages excluded from ranking')
        draft={'numero':'DRAFT-RANK','cliente_nombre':'Test','items':[{'code':'R-C','desc':c['nombre'],'tipo':'repuesto','product_id':c['id'],'price':10,'qty':99,'currency':'PEN'}],'moneda_mostrar':'PEN'}
        expect(call('/api/cotizador','POST',draft,owner)[0]==201,'calculator trial saved')
        expect(call('/api/estadisticas',token=owner)[1]['top_repuestos'][0]['solicitudes']==5,'calculator trial excluded from ranking')
        official={**draft,'numero':'OFFICIAL-RANK','registro_clave':'rank-official','oficial':True}
        pdf=b'%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\n%%EOF'
        expect(multipart('/api/cotizador',{'datos':json.dumps(official)},owner,'rank.pdf',pdf,'pdf')[0]==201,'official in-person quote saved')
        expect(call('/api/estadisticas',token=owner)[1]['top_repuestos'][0]['solicitudes']==6,'official in-person quote included once')
        expect(call('/api/cotizaciones/'+str(mq['id']),'DELETE',{'motivo':'Test'},owner)[0]==200,'quote soft delete')
        expect(call('/api/estadisticas',token=owner)[1]['top_maquinarias'][0]['solicitudes']==1,'trashed request excluded')
        expect(call('/api/estadisticas',token=calc)[0]==403,'cotizador statistics access remains blocked')
        print(json.dumps({'passed':len(passed),'checks':passed},ensure_ascii=False,indent=2))
    finally:proc.terminate();proc.wait(timeout=5)
