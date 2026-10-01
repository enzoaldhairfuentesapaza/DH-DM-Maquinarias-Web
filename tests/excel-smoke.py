"""Disposable integration test: never point this at production.
Usage: HDM_TEST_CONFIG=/absolute/path/test-config.php python tests/api-smoke.py
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
        def login(email): return call('/api/auth/login','POST',{'email':email,'password':'TestPassword123!'})[1]['access_token']
        owner=login('owner@example.test')
        call('/api/auth/registro','POST',{'nombre':'Cliente','email':'client@example.test','password':'TestPassword123!'})
        customer=login('client@example.test')
        call('/api/accesos','POST',{'nombre':'Cotizador','email':'quote@example.test','password':'TestPassword123!','rol':'cotizador'},owner)
        internal=login('quote@example.test')
        call('/api/accesos','POST',{'nombre':'Admin','email':'admin@example.test','password':'TestPassword123!','rol':'admin'},owner)
        admin=login('admin@example.test')
        expect(call('/api/excel')[0]==401,'Excel requires authentication')
        expect(call('/api/excel',token=customer)[0]==403,'customers denied Excel')
        schemas=call('/api/excel',token=owner)[1]
        expect(len(schemas)==16,'all 16 sections have Excel schemas including contacts')
        expect({s['key'] for s in call('/api/excel',token=internal)[1]}=={'ventas','cotizaciones','cotizador'} and all(not s['importable'] for s in call('/api/excel',token=internal)[1]),'cotizador Excel is export-only for business sections')
        expect(call('/api/excel/accesos/export',token=admin)[0]==403,'admin denied account export')
        expect(call('/api/excel/repuestos/export',token=internal)[0]==403,'cotizador denied catalog export')
        expect(call('/api/excel/missing/export',token=owner)[0]==404,'unknown table cannot query arbitrary SQL')
        expect(call('/api/excel/repuestos/schema/extra',token=owner)[0]==404,'Excel route tails are exact')
        examples={
          'novedades':{'titulo':'Novedad Excel','categoria':'Obra','fecha':'2026-10-01','resumen':'Texto'},
          'blog':{'titulo':'Blog Excel','categoria':'Obra','fecha':'2026-10-01','resumen':'Texto','contenido':['Párrafo']},
          'promociones':{'titulo':'Promo Excel','descripcion':'Texto','vigencia':'Octubre','destacado':True},
          'maquinaria':{'nombre':'Máquina Excel','marca':'CAT','categoria':'Excavadoras','descripcion':'Texto','especificaciones':[{'label':'Potencia','valor':'100 HP'}]},
          'repuestos':{'codigo':'0001-X','nombre':'Filtro Excel','marca':'CAT','categoria':'Filtros','descripcion':'Texto','modelo_recomendado':['320D'],'stock_cantidad':7,'stock_disponible':True},
          'ventas':{'numero_boleta':'B0001','cliente_nombre':'Cliente Excel','fecha':'2026-10-01','productos':[{'nombre':'Filtro','cantidad':'1','precio':'10'}],'total':10},
          'categorias':{'tipo':'repuesto','nombre':'Excel Categoría'},
          'accesos':{'nombre':'Excel Cliente','email':'excel@example.test','password':'TestPassword123!','rol':'cliente'},
          'cotizaciones':{'nombre_cliente':'Cliente Excel','email_cliente':'excel@example.test','detalle':{'productos':[{'tipo':'repuesto','nombre':'Filtro','cantidad':2}]}},
          'cotizador':{'numero':'C-0001','cliente_nombre':'Cliente Excel','items':[{'code':'X','qty':1,'price':10}],'moneda_mostrar':'PEN','total':10},
          'sugerencias':{'tipo':'sugerencia','nombre':'Excel Cliente','correo':'excel@example.test','mensaje':'Mejora'},
          'configuracion':{'clave':'correo_contacto','valor':'empresa@example.test'},
        }
        def excel(key,action,rows,duplicate=False):return call(f'/api/excel/{key}/{action}','POST',{'rows':rows,'allow_duplicates':duplicate},owner)
        for key,row in examples.items():
            before=len(call(f'/api/excel/{key}/export',token=owner)[1]['rows'])
            status,preview,_=excel(key,'preview',[row])
            expect(status==200 and not preview['rows'][0]['errors'],f'{key}: valid preview')
            expect(len(call(f'/api/excel/{key}/export',token=owner)[1]['rows'])==before,f'{key}: preview does not write')
            if key=='accesos':expect('password' not in preview['rows'][0]['data'],'review never returns password')
            status,result,_=excel(key,'import',[row])
            expect(status==200 and result['inserted']+result['updated']==1,f'{key}: import persists typed row')
        exported=call('/api/excel/repuestos/export',token=owner)[1]['rows'][0]
        expect(exported['codigo']=='0001-X' and exported['modelo_recomendado']==['320D'] and exported['stock_cantidad']==7,'text codes, JSON and stock round trip')
        users=call('/api/excel/accesos/export',token=owner)[1]['rows']
        expect(all('hashed_password' not in u and 'password' not in u and 'token_version' not in u for u in users),'account export never leaks hashes or tokens')
        rep=examples['repuestos']
        expect(excel('repuestos','import',[rep])[1]['skipped']==1,'existing part code skipped by default')
        expect(excel('repuestos','import',[rep],True)[1]['inserted']==1,'explicit duplicate option accepted for catalog')
        second={**rep,'codigo':'0002-X'}
        preview=excel('repuestos','preview',[second])[1]['rows'][0]
        expect(not preview['skip'] and any('nombre' in w for w in preview['warnings']),'same-name different-code parts warn but remain importable')
        expect(excel('categorias','import',[examples['categorias']],True)[1]['skipped']==1,'unique categories always skipped')
        expect(excel('accesos','import',[examples['accesos']],True)[1]['skipped']==1,'unique emails always skipped')
        fresh={**rep,'codigo':'0003-X'}
        result=excel('repuestos','import',[fresh,fresh])[1]
        expect(result['inserted']==1 and result['skipped']==1,'duplicates inside same batch skipped')
        before=len(call('/api/excel/repuestos/export',token=owner)[1]['rows'])
        expect(excel('repuestos','import',[{**rep,'codigo':'0004-X'},{**rep,'codigo':'0005-X','stock_cantidad':-1}])[0]==422,'invalid batch rejected')
        expect(len(call('/api/excel/repuestos/export',token=owner)[1]['rows'])==before,'invalid batch is atomic')
        expect(excel('repuestos','preview',[{**rep,'stock_disponible':'false'}])[1]['rows'][0]['errors'],'boolean strings cannot silently enable stock')
        expect(excel('repuestos','preview',[{**rep,'stock_cantidad':1.5}])[1]['rows'][0]['errors'],'fractional stock rejected')
        expect(excel('repuestos','import',[{**rep,'id':999}])[0]==422,'IDs cannot overwrite existing rows')
        expect(excel('accesos','import',[{**examples['accesos'],'hashed_password':'bad'}])[0]==422,'password hash injection rejected')
        expect(excel('repuestos','import',[rep]*501)[0]==422,'batch row limit enforced')
        expect(excel('cotizaciones','import',[{**examples['cotizaciones'],'usuario_id':1}])[0]==422,'quote ownership cannot be forged by spreadsheet')
        expect(excel('configuracion','import',[{'clave':'secret_key','valor':'bad'}])[0]==422,'configuration allowlist enforced')
        result=excel('configuracion','import',[{'clave':'correo_contacto','valor':'new@example.test'}])[1]
        expect(result['updated']==1,'contacts update only their allowlisted key')
        for key in ['auditoria','papelera','notificaciones']:
            expect(call(f'/api/excel/{key}/export',token=owner)[0]==200,f'{key}: export allowed')
            expect(excel(key,'import',[{'nombre':'Fake'}])[0]==403,f'{key}: system-generated rows cannot be imported')
        audit=call('/api/excel/auditoria/export',token=owner)[1]['rows']
        expect(any(a['accion']=='importar' and 'Excel:' in a['descripcion'] for a in audit),'bulk imports recorded in audit')
        expect(call('/api/health')[0]==200,'API remains healthy after rejected batches')
        print(json.dumps({'passed':len(passed),'checks':passed},indent=2,ensure_ascii=False))
    finally:
        proc.terminate();proc.wait(timeout=5)
