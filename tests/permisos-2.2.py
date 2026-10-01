"""Disposable integration test: never point this at production.
Usage: python tests/permisos-2.2.py
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
        expect(call('/api/estadisticas',token=calc)[0]==403,'cotizador cannot read statistics')
        expect(call('/api/excel',token=calc)[0]==200,'cotizador can open export-only Excel')
        expect(all(not s['importable'] for s in call('/api/excel',token=calc)[1]),'cotizador schemas prohibit import')
        expect(call('/api/excel/cotizaciones/export',token=calc)[0]==200,'cotizador can export permitted quotes')
        expect(call('/api/excel/cotizaciones/import','POST',{'rows':[]},calc)[0]==403,'cotizador cannot import Excel directly')
        expect(call('/api/estadisticas',token=admin)[0]==200,'admin retains statistics')
        expect(call('/api/roles/owner/extra',token=owner)[0]==404,'role routes reject unexpected tails')
        expect(call('/api/accesos','POST',{'nombre':'Invalid','email':'invalid@example.test','password':'TestPassword123!','rol':[]},owner)[0]==400,'account role validates data type')
        roles=call('/api/roles',token=owner)[1]
        expect(len(roles['roles'])==4 and 'calculadora' in roles['secciones'],'builtin roles and section labels visible')
        for token in [admin,calc,client]:expect(call('/api/roles',token=token)[0]==403,'only owner lists role definitions')
        expect(call('/api/roles','POST',{'nombre':'Escalation','permisos':['accesos']},owner)[0]==422,'custom role cannot gain owner permissions')
        expect(call('/api/roles/owner','PUT',{'nombre':'Changed','permisos':['calculadora']},owner)[0]==403,'builtin owner immutable')
        status,role,_=call('/api/roles','POST',{'nombre':'Editor Blog','permisos':['blog','excel']},owner)
        expect(status==201,'create custom role')
        expect(call('/api/roles','POST',{'nombre':'Editor Blog','permisos':['blog']},owner)[0]==409,'duplicate role name rejected')
        account=call('/api/accesos','POST',{'nombre':'Editor','email':'editor@example.test','password':'TestPassword123!','rol':role['clave']},owner)[1]
        editor=login('editor@example.test')
        me=call('/api/auth/me',token=editor)[1]
        expect(me['permisos']==['blog','excel'] and me['rol_nombre']=='Editor Blog','custom account receives grants and readable role')
        expect(call('/api/estadisticas',token=editor)[0]==403,'custom role blocked from unassigned statistics')
        expect(call('/api/cotizaciones',token=editor)[0]==403,'custom role blocked from unassigned quotes')
        blog={'titulo':'Test blog','categoria':'Test','fecha':'2026-10-01','resumen':'Resumen','contenido':['Texto'],'destacado':False}
        expect(call('/api/blog','POST',blog,editor)[0]==201,'custom editor can create blog')
        expect(call('/api/novedades','POST',{'titulo':'Denied'},editor)[0]==403,'custom editor cannot edit unassigned content')
        expect([x['key'] for x in call('/api/excel',token=editor)[1]]==['blog'],'Excel lists only assigned sections')
        expect(call('/api/excel/repuestos/export',token=editor)[0]==403,'cannot export unassigned catalogue')
        expect(call('/api/configuracion','PUT',{'email':'changed@example.test'},editor)[0]==403,'owner contacts remain protected')
        expect(call('/api/roles/'+role['clave'],'DELETE',token=owner)[0]==409,'role with assigned account cannot be deleted')
        expect(call('/api/roles/'+role['clave'],'PUT',{'nombre':'Cotizador a medida','permisos':['calculadora','cotizaciones']},owner)[0]==200,'edit custom role')
        expect(call('/api/blog','POST',blog,editor)[0]==403,'permission revocation applies to existing token')
        expect(call('/api/cotizador',token=editor)[0]==200,'new permission applies to existing token')
        call('/api/roles/'+role['clave'],'PUT',{'nombre':'Calculadora de pruebas','permisos':['calculadora']},owner)
        expect(call('/api/cotizador','POST',{'numero':'ONLY-CALC','cliente_nombre':'Test','oficial':True},editor)[0]==403,'calculator-only role cannot register official quotes')
        expect(call('/api/cotizador','POST',{'numero':'ONLY-CALC','cliente_nombre':'Test','solicitud_id':1,'items':[{'code':'P','unit':'UND','brand':'X','desc':'Test','price':10,'qty':1,'currency':'PEN'}],'moneda_mostrar':'PEN'},editor)[0]==403,'calculator-only role cannot access source quote through saving')
        call('/api/roles/'+role['clave'],'PUT',{'nombre':'Cotizador a medida','permisos':['calculadora','cotizaciones']},owner)
        item={'code':'X','unit':'UND','brand':'CAT','qty':2,'price':100,'currency':'USD','desc':'Test','discounts':[10],'brandAdjustments':[18],'tipo':'repuesto'}
        base={'numero':'COT-22','cliente_nombre':'Cliente','items':[item],'tipo_cambio':3.5,'moneda_mostrar':'PEN','registro_clave':'part-test'}
        status,trial,_=call('/api/cotizador','POST',base,calc)
        expect(status==201 and float(trial['total'])==744,'cotizador preserves price calculation and trial saving')
        machine={**base,'items':[{**item,'tipo':'maquinaria'}],'registro_clave':'machine-test'}
        for token in [admin,calc,editor]:expect(call('/api/cotizador','POST',machine,token)[0]==403,'machine calculator owner only')
        status,mt,_=call('/api/cotizador','POST',machine,owner)
        expect(status==201,'owner can save machine trial')
        for token in [admin,calc,editor]:
            expect(call('/api/cotizador/'+str(mt['id']),token=token)[0]==404,'machine history hidden from nonowner')
            expect(all(not any(i.get('tipo')=='maquinaria' for i in q['items']) for q in call('/api/cotizador',token=token)[1]),'machine trials excluded from history')
            expect(call('/api/cotizador/'+str(mt['id']),'DELETE',token=token)[0]==403,'cannot delete machine trial')
        request={'nombre_cliente':'Cliente web','email_cliente':'client@example.test','detalle':{'productos':[{'nombre':'Machine','cantidad':1,'tipo':'maquinaria'}]},'origen':'whatsapp'}
        status,mq,_=call('/api/cotizaciones','POST',request,client)
        expect(status==201,'public customer can still request machine quotation')
        for token in [admin,calc,editor]:
            expect(call('/api/cotizaciones/'+str(mq['id']),token=token)[0]==403,'nonowner cannot read machine request')
            expect(call('/api/cotizaciones/'+str(mq['id'])+'/estado','PUT',{'estado':'respondida'},token)[0]==403,'nonowner cannot respond to machine request')
            expect(call('/api/cotizaciones/'+str(mq['id']),'DELETE',{'motivo':'Test'},token)[0]==403,'nonowner cannot delete machine request')
            expect(not any(q['id']==mq['id'] for q in call('/api/cotizaciones',token=token)[1]),'machine requests omitted from nonowner inbox')
        expect(call('/api/cotizaciones/'+str(mq['id']),token=owner)[0]==200,'owner reads machine request')
        expect(call('/api/cotizador','POST',{**base,'solicitud_id':mq['id'],'registro_clave':'mislabelled-source'},calc)[0]==403,'machine source protected even when items are labelled parts')
        expect(call('/api/excel/cotizaciones/export?tipo=maquinaria',token=admin)[0]==403,'nonowner cannot export machine quotes')
        expect(not any(q['id']==mq['id'] for q in call('/api/excel/cotizaciones/export',token=admin)[1]['rows']),'machine requests omitted from general Excel')
        png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=')
        expect(multipart('/api/uploads',{},editor,'test.png',png)[0]==403,'quote role cannot upload content images')
        pdf=b'%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\n%%EOF'
        status,formal,_=multipart('/api/cotizador',{'datos':json.dumps({**machine,'oficial':True,'solicitud_id':mq['id'],'registro_clave':'official-machine'})},owner,'test.pdf',pdf,'pdf')
        expect(status==201 and formal['cotizacion_id']==mq['id'],'owner can register machine official linked to source')
        for token in [admin,calc,editor]:expect(call(formal['archivo_pdf'],token=token)[0]==403,'machine PDF restricted from nonowner staff')
        expect(call(formal['archivo_pdf'],token=owner)[0]==200,'owner can download machine PDF')
        expect(call(formal['archivo_pdf'],token=client)[0]==200,'requesting customer can download own machine reply')
        before=len(call('/api/cotizador',token=owner)[1]);php('migrate.php',env)
        expect(len(call('/api/cotizador',token=owner)[1])==before,'repeated migration preserves history')
        expect(any(r['clave']==role['clave'] for r in call('/api/roles',token=owner)[1]['roles']),'repeated migration preserves custom roles')
        expect(call('/api/accesos/'+str(account['id'])+'/rol','PUT',{'rol':'cliente'},owner)[0]==200,'owner can reassign custom account')
        expect(call('/api/roles/'+role['clave'],'DELETE',token=owner)[0]==200,'unused custom role can be removed')
        print(json.dumps({'passed':len(passed),'checks':passed},ensure_ascii=False,indent=2))
    finally:proc.terminate();proc.wait(timeout=5)
