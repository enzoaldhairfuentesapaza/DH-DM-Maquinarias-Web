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
        call('/api/accesos','POST',{'nombre':'Cotizador','email':'calc@example.test','password':'TestPassword123!','rol':'cotizador'},owner)
        calc=login('calc@example.test')
        for channel in ['pagina','whatsapp','correo']:
            status,msg,_=call('/api/contactos','POST',{'nombre_cliente':'Consulta '+channel,'email_cliente':'visitor@example.test','detalle':{'asunto':'Consulta general','mensaje':'Mensaje real','canal':channel}},client)
            expect(status==201 and msg['origen']=='contacto' and msg['detalle']['canal']==channel,'contact persists '+channel)
        expect(len(call('/api/contactos',token=admin)[1])==3,'separate contact inbox')
        expect(call('/api/cotizaciones',token=admin)[1]==[],'contacts excluded from quotations')
        expect(call('/api/contactos',token=calc)[0]==403,'calculator role cannot read contact inbox')
        expect(call('/api/cotizaciones/mias',token=client)[1]==[],'client quote history excludes general contacts')
        expect(len(call('/api/contactos/mias',token=client)[1])==3,'own contact history separate')
        expect(call('/api/contactos',token=client)[0]==403,'client cannot read other messages')
        contactId=call('/api/contactos',token=owner)[1][0]['id']
        expect(call('/api/contactos/'+str(contactId),'DELETE',{'motivo':'Prueba'},admin)[0]==200,'contact soft deletion')
        expect(len(call('/api/contactos/papelera',token=owner)[1])==1,'contact trash independent')
        expect(call('/api/cotizaciones/papelera',token=owner)[1]==[],'quotation trash excludes contacts')
        expect(call('/api/contactos/papelera',token=admin)[0]==403,'contact trash owner only')
        expect(call('/api/contactos/'+str(contactId)+'/restaurar','PUT',{},owner)[0]==200,'owner can restore contact message')
        item={'code':'F-1','unit':'UND','brand':'CAT','qty':2,'price':100,'currency':'USD','desc':'Filtro','discounts':[10],'brandAdjustments':[18],'showDiscounts':True,'tipo':'repuesto'}
        base={'numero':'COT-TEST','cliente_nombre':'Cliente presencial','cliente_documento':'00123456','cliente_direccion':'Arequipa','cliente_email':'client@example.test','cliente_telefono':'987654321','items':[item],'tipo_cambio':3.5,'moneda_mostrar':'PEN','total':1,'registro_clave':'draft-key'}
        status,draft,_=call('/api/cotizador','POST',base,calc)
        expect(status==201 and not draft['oficial'],'calculator defaults to non-official history')
        expect(float(draft['total'])==744,'server computes conversion, adjustments, discounts and integer rounding')
        expect(call('/api/cotizaciones',token=owner)[1]==[],'saving draft creates no official request')
        expect(call('/api/cotizador','POST',base,calc)[1]['id']==draft['id'],'retry does not duplicate saved document')
        expect(call('/api/cotizador','POST',base,client)[0]==403,'client cannot save calculator document')
        official={**base,'numero':'COT-OFFICIAL','registro_clave':'official-key','oficial':True}
        expect(call('/api/cotizador','POST',official,owner)[0]==422,'official save requires PDF')
        pdf=b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'
        status,registered,_=multipart('/api/cotizador',{'datos':json.dumps(official)},owner,'cotizacion.pdf',pdf,'pdf')
        expect(status==201 and registered['oficial'] and registered['archivo_pdf'],'in-person official stores PDF and customer')
        request=call('/api/cotizaciones/'+str(registered['cotizacion_id']),token=owner)[1]
        expect(request['origen']=='presencial' and request['nombre_cliente']=='Cliente presencial' and request['estado']=='respondida','official visible in quotation inbox')
        expect(request['archivo_respuesta']==registered['archivo_pdf'],'official PDF attached to request')
        expect(call(registered['archivo_pdf'],token=owner)[0]==200,'internal role can download stored official PDF')
        expect(call(registered['archivo_pdf'],token=client)[0]==403,'unrelated client cannot download in-person PDF')
        expect(call('/api/cotizador/'+str(registered['id']),'DELETE',token=owner)[0]==409,'official history cannot be deleted')
        expect(call('/api/cotizador/'+str(draft['id']),'DELETE',token=calc)[0]==200,'draft history can be deleted')
        source=call('/api/cotizaciones','POST',{'nombre_cliente':'Cliente web','email_cliente':'client@example.test','detalle':{'productos':[{'id':1,'nombre':'Filtro','tipo':'repuesto','cantidad':2}]},'origen':'whatsapp'},client)[1]
        linked={**official,'registro_clave':'linked-key','numero':'COT-LINK','solicitud_id':source['id']}
        count=len(call('/api/cotizaciones',token=owner)[1])
        status,linkedRow,_=multipart('/api/cotizador',{'datos':json.dumps(linked)},admin,'cotizacion.pdf',pdf,'pdf')
        expect(status==201 and linkedRow['cotizacion_id']==source['id'],'official linked to received request')
        expect(len(call('/api/cotizaciones',token=owner)[1])==count,'linked save does not duplicate request')
        sourceRow=call('/api/cotizaciones/'+str(source['id']),token=owner)[1]
        expect(sourceRow['estado']=='respondida' and sourceRow['archivo_respuesta'] and sourceRow['origen']=='whatsapp','source response and PDF saved preserving reception channel')
        expect(call(sourceRow['archivo_respuesta'],token=client)[0]==200,'source client can download their published PDF')
        expect(len(call('/api/notificaciones',token=client)[1])==1,'client notified of official page response')
        status,retry,_=multipart('/api/cotizador',{'datos':json.dumps(linked)},admin,'cotizacion.pdf',pdf,'pdf')
        expect(status==200 and retry['id']==linkedRow['id'],'official retry is idempotent')
        expect(len(call('/api/notificaciones',token=client)[1])==1,'retry does not duplicate notification')
        mixed={**official,'registro_clave':'mixed-key','items':[item,{**item,'tipo':'maquinaria'}]}
        expect(multipart('/api/cotizador',{'datos':json.dumps(mixed)},owner,'cotizacion.pdf',pdf,'pdf')[0]==422,'mixed official products require separate documents')
        bad={**base,'registro_clave':'bad-rate','tipo_cambio':0}
        expect(call('/api/cotizador','POST',bad,owner)[0]==422,'conversion requires positive rate')
        expect(call('/api/excel/cotizaciones/export',token=owner)[0]==200,'quotation export available')
        contactExport=call('/api/excel/contactos/export',token=owner)[1]
        expect(all(r['origen']=='contacto' for r in contactExport['rows']),'contact export isolated')
        quoteExport=call('/api/excel/cotizaciones/export',token=owner)[1]
        expect(all(r['origen']!='contacto' for r in quoteExport['rows']),'quotation export excludes contacts')
        php('migrate.php',env)
        expect(len(call('/api/cotizador',token=owner)[1])==2,'repeat migration preserves calculator history')
    finally:
        proc.terminate();proc.wait(timeout=5)
print(json.dumps({'passed':len(passed),'checks':passed},indent=2))
