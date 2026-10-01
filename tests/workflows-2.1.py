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
        def login(email):return call('/api/auth/login','POST',{'email':email,'password':'TestPassword123!'})[1]['access_token']
        owner=login('owner@example.test')
        call('/api/accesos','POST',{'nombre':'Admin','email':'admin@example.test','password':'TestPassword123!','rol':'admin'},owner)
        admin=login('admin@example.test')
        call('/api/auth/registro','POST',{'nombre':'Cliente','email':'client@example.test','password':'TestPassword123!'})
        client=login('client@example.test')
        status,welcome,_=call('/api/bienvenida')
        expect(status==200 and welcome['titulo_destacado']=='repuestos originales','public welcome defaults preserve original title')
        expect(welcome['despachos_valor']=='+2000' and welcome['stock_valor']=='+5000' and welcome['garantia_valor']=='100%','welcome preserves original business statistics')
        expect(call('/api/bienvenida','PUT',welcome,client)[0]==403,'client cannot edit welcome')
        draft={**welcome,'descripcion':'Bienvenidos: texto guardado por admin.'}
        expect(call('/api/bienvenida','PUT',draft,admin)[0]==200,'admin can edit welcome independently of promotions')
        expect(call('/api/bienvenida')[1]['descripcion']==draft['descripcion'],'welcome draft persisted')
        php('migrate.php',env)
        expect(call('/api/bienvenida')[1]['descripcion']==draft['descripcion'],'repeatable migration preserves edited welcome')
        expect(call('/api/bienvenida','PUT',{**welcome,'boton_repuestos_url':'javascript:alert(1)'},owner)[0]==422,'welcome links reject unsafe protocols')
        expect(call('/api/bienvenida/extra')[0]==404,'welcome route is exact')
        before=call('/api/configuracion')[1]
        expect(call('/api/configuracion','PUT',{'whatsapp_primario':'51911111111'},admin)[0]==403,'admin cannot change contact numbers')
        expect(call('/api/configuracion')[1]==before,'denied contact edit leaves values intact')
        expect(call('/api/excel/configuracion/import','POST',{'rows':[{'clave':'correo_contacto','valor':'x@example.test'}]},admin)[0]==403,'Excel cannot bypass owner-only contacts')
        expect(not any(s['key']=='configuracion' for s in call('/api/excel',token=admin)[1]),'admin Excel center hides contacts')
        expect(call('/api/configuracion','PUT',{'whatsapp_secundario':'51922222222'},owner)[0]==200,'owner can change secondary phone')
        detail={'productos':[{'tipo':'repuesto','nombre':'Filtro','cantidad':2},{'tipo':'maquinaria','nombre':'Excavadora','cantidad':1}],'mensaje':'Dos canales'}
        payload={'nombre_cliente':'Cliente','email_cliente':'client@example.test','detalle':detail,'origen':'pagina'}
        status,saved,_=call('/api/cotizaciones','POST',payload,client)
        expect(status==201 and len(saved['solicitudes'])==2,'mixed request produces two distinct quotes atomically')
        expect({q['detalle']['tipo_solicitud'] for q in saved['solicitudes']}=={'repuesto','maquinaria'},'each quote has a separate business channel')
        expect(all(len(q['detalle']['productos'])==1 and q['detalle']['productos'][0]['tipo']==q['detalle']['tipo_solicitud'] for q in saved['solicitudes']),'each quote contains only its product group')
        expect(len(call('/api/cotizaciones/mias',token=client)[1])==2,'client history preserves both independent requests')
        expect(all(q['detalle']['mensaje']=='Dos canales' for q in saved['solicitudes']),'splitting preserves shared request details')
        expect(call('/api/excel/cotizaciones/import','POST',{'rows':[payload]},owner)[0]==422,'Excel cannot reintroduce mixed channel quotes')
        single={**payload,'detalle':{'productos':[detail['productos'][0]]}}
        expect('id' in call('/api/cotizaciones','POST',single,client)[1],'single-group response remains compatible')
        scoped=call('/api/excel/cotizaciones/export?tipo=maquinaria',token=owner)[1]['rows']
        expect(len(scoped)==1 and scoped[0]['detalle']['productos'][0]['tipo']=='maquinaria','machinery inbox Excel export excludes parts')
        expect(len(call('/api/excel/cotizaciones/export?tipo=repuesto',token=owner)[1]['rows'])==2,'parts inbox Excel export includes only its requests')
        expect(call('/api/excel/cotizaciones/export?tipo=bad',token=owner)[0]==422,'invalid Excel group rejected')
        expect(call('/api/excel/cotizaciones/import?tipo=maquinaria','POST',{'rows':[single]},owner)[0]==422,'import cannot add parts to machinery inbox')
        print(json.dumps({'passed':len(passed),'checks':passed},indent=2,ensure_ascii=False))
    finally:
        proc.terminate();proc.wait(timeout=5)
