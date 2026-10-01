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
        expect(call('/api/health')[0]==200,'health checks DB')
        expect(call('/api/health','POST',{})[0]==404,'health read-only')
        expect(call('/api/seed.php')[0]==403,'maintenance blocked by HTTP')
        expect(call('/api/hdm.db')[0]==403,'SQLite download blocked')
        expect(call('/api/private/x')[0]==403,'private folder blocked')
        expect(call('/apirepuestos')[0]==404,'API prefix is exact')
        expect(call('/api/accesos')[0]==401,'accounts require auth')
        expect(call('/api/auth/registro','POST',{'nombre':'X','email':'bad','password':'12345678'})[0]==422,'registration email validation')
        expect(call('/api/auth/registro','POST',{'nombre':'X','email':'short@example.test','password':'123'})[0]==422,'password validation')
        expect(call('/api/auth/registro','POST',b'{broken')[0]==400,'malformed JSON rejected')
        expect(call('/api/auth/registro','POST',b'[]')[0]==400,'JSON must be object')
        client={'nombre':'Cliente','email':'client@example.test','password':'TestPassword123!','rol':'owner'}
        status,row,_=call('/api/auth/registro','POST',client)
        expect(status==201 and row['rol']=='cliente' and 'hashed_password' not in row,'registration cannot escalate role or leak hash')
        expect(call('/api/auth/registro','POST',client)[0]==400,'duplicate email handled')
        def login(email):return call('/api/auth/login','POST',{'email':email,'password':'TestPassword123!'})[1]['access_token']
        owner=login('owner@example.test');customer=login('client@example.test')
        expect(call('/api/auth/me',token=owner)[1]['rol']=='owner','owner authentication')
        expect(call('/api/auth/me',token='a.b.c')[0]==401,'malformed JWT rejected')
        expect(call('/api/auth/me',token=owner,headers={'X-Auth-Token':'','Authorization':f'Bearer {owner}'})[0]==200,'Bearer auth supported')
        expect(call('/api/ventas',token=customer)[0]==403,'client denied sales')
        expect(call('/api/cotizador',token=customer)[0]==403,'formal calculator is internal')
        status,row,_=call('/api/accesos','POST',{'nombre':'Cotizador','email':'quote@example.test','password':'TestPassword123!','rol':'cotizador'},owner)
        internal_id=row['id']; expect(status==201,'create cotizador role');internal=login('quote@example.test')
        expect(call('/api/sugerencias',token=internal)[0]==403,'cotizador denied complaints')
        expect(call('/api/estadisticas',token=internal)[0]==403,'cotizador denied statistics')
        expect(call('/api/accesos',token=internal)[0]==403,'cotizador denied accounts')
        expect(call('/api/repuestos','POST',{'codigo':'X'},owner)[0]==422,'CRUD required fields')
        rep={'codigo':'X','nombre':'Filtro','marca':'CAT','categoria':'Filtros','descripcion':'Prueba','stock_cantidad':2,'stock_disponible':True,'destacado':False}
        status,row,_=call('/api/repuestos','POST',rep,owner);rid=row.get('id')
        expect(status==201,'create product with schema defaults')
        expect(call(f'/api/repuestos/{rid}','POST',{'nombre':'Filtro editado'},owner,{'X-HTTP-Method-Override':'PUT'})[0]==200,'hosting method override')
        row=call(f'/api/repuestos/{rid}')[1]
        expect(row['codigo']=='X' and row['stock_cantidad']==2,'partial update preserves existing fields')
        expect(call(f'/api/repuestos/{rid}','PUT',{'stock_cantidad':-1},owner)[0]==422,'negative stock rejected')
        expect(call(f'/api/repuestos/{rid}/extra','DELETE',token=owner)[0]==404,'CRUD route tails exact')
        expect(call('/api/repuestos','POST',rep,customer)[0]==403,'client denied mutations')
        request={'nombre_cliente':'Cliente','email_cliente':'client@example.test','detalle':{'productos':[{'tipo':'repuesto','nombre':'Filtro','cantidad':2}],'mensaje':'Consulta'},'origen':'pagina'}
        status,quote,_=call('/api/cotizaciones','POST',request,customer);qid=quote['id']
        expect(status==201,'quote creation')
        expect(call('/api/cotizaciones',token=customer)[0]==403,'client denied all quotes')
        expect(call(f'/api/cotizaciones/{qid}/estado','PUT',{'estado':'respondida','respuesta':'Respuesta interna','mostrar_en_pagina':False},owner)[0]==200,'internal response saved')
        mine=call('/api/cotizaciones/mias',token=customer)[1]
        expect(mine[0]['respuesta'] == 'Respuesta interna','responses are also published in owning customer account')
        png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pCYAAAAASUVORK5CYII=')
        expect(multipart('/api/uploads',{},owner,'fake.png',b'<?php echo 1;?>')[0]==422,'fake image rejected by MIME')
        status,img,_=multipart('/api/uploads',{},owner,'pixel.png',png)
        expect(status==200 and img['url'].startswith('/api/uploads/'),'real image upload uses correct URL')
        pdf=b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'
        status,quote,_=multipart(f'/api/cotizaciones/{qid}/responder',{'estado':'respondida','respuesta':'Visible','mostrar_en_pagina':'1'},owner,'quote.pdf',pdf,'archivo')
        expect(status==200,'quote PDF upload')
        doc=quote['archivo_respuesta']
        expect(doc.startswith('/api/documentos/'),'attachment private URL')
        expect(call(doc)[0]==401,'attachment requires token')
        expect(call(doc,token=customer)[0]==200,'own visible attachment downloadable')
        call('/api/auth/registro','POST',{'nombre':'Otro','email':'other@example.test','password':'TestPassword123!'})
        other=login('other@example.test')
        expect(call(doc,token=other)[0]==403,'other customer denied attachment')
        expect(call('/api/notificaciones',token=customer)[1][0]['archivo_respuesta']==doc,'visible attachment in notification')
        call(f'/api/cotizaciones/{qid}/estado','PUT',{'estado':'respondida','mostrar_en_pagina':False},owner)
        expect(call(doc,token=customer)[0]==200,'page publication remains available to owning customer')
        expect(call('/api/notificaciones',token=customer)[1][0]['archivo_respuesta']==doc,'owning customer notification retains published PDF')
        status,_,_=call(f'/api/cotizaciones/{qid}','DELETE',{'motivo':'Prueba'},internal)
        expect(status==200,'quote soft deletion')
        expect(call('/api/cotizaciones/mias',token=customer)[1]==[],'trash hidden from customer history')
        expect(call('/api/cotizaciones/papelera',token=internal)[0]==403,'trash owner only')
        expect(len(call('/api/cotizaciones/papelera',token=owner)[1])==1,'owner sees trash')
        call(f'/api/cotizaciones/{qid}/restaurar','PUT',{},owner)
        expect(len(call('/api/cotizaciones/mias',token=customer)[1])==1,'owner restores quote')
        expect(call('/api/configuracion','PUT',{'secret':'x'},owner)[0]==422,'configuration allowlist')
        expect(call('/api/configuracion','PUT',{'correo_contacto':'invalid'},owner)[0]==422,'contact email validated')
        expect(call('/api/configuracion','PUT',{'whatsapp_primario':'51987654321'},owner)[0]==200,'contact configuration saved')
        expect(call('/api/sugerencias','POST',{'nombre':'Persona','mensaje':'Hola','correo':'bad'})[0]==422,'suggestion email validated')
        for _ in range(30):call('/api/sugerencias','POST',{'nombre':'Persona','mensaje':'Hola'})
        expect(call('/api/sugerencias','POST',{'nombre':'Persona','mensaje':'Hola'})[0]==429,'public form rate limit')
        expect(call('/api/health',headers={'Origin':'https://evil.example'})[2].get('Access-Control-Allow-Origin') is None,'untrusted CORS origin denied')
        expect(call('/api/health',headers={'Origin':'http://localhost:5173'})[2].get('Access-Control-Allow-Origin')=='http://localhost:5173','local CORS origin allowed')
        expect(call('/api/auth/registro','POST',{'nombre':'Espacios','email':'spaces@example.test','password':' spaced password '})[0]==201,'password with spaces accepted')
        expect(call('/api/auth/login','POST',{'email':'spaces@example.test','password':' spaced password '})[0]==200,'password whitespace preserved at login')
        expect(call(f'/api/accesos/{internal_id}','PUT',{'password':'ChangedPassword123!'},owner)[0]==200,'owner resets password')
        expect(call('/api/auth/me',token=internal)[0]==401,'password reset revokes existing JWT')
        expect(call('/api/auth/login','POST',{'email':'quote@example.test','password':'ChangedPassword123!'})[0]==200,'new password login works')
        for _ in range(25):call('/api/auth/login','POST',{'email':'owner@example.test','password':'wrong'})
        expect(call('/api/auth/login','POST',{'email':'owner@example.test','password':'wrong'})[0]==429,'login rate limit')
        print(json.dumps({'passed':len(passed),'checks':passed},ensure_ascii=False,indent=2))
    finally:
        proc.terminate();proc.wait(timeout=5)
