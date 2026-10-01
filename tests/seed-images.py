"""Regression checks for offline seed images; uses a disposable SQLite database."""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PHP = os.environ.get('PHP_BIN', 'php')
checks = []

def expect(ok, label):
    assert ok, label
    checks.append(label)

with tempfile.TemporaryDirectory(prefix='hdm-images-') as folder:
    tmp = Path(folder)
    def php_path(p):
        return "'" + p.as_posix().replace("'", "\\'") + "'"
    cfg = tmp / 'config.php'
    cfg.write_text("<?php return ['app_env'=>'test','secret_key'=>'test-seed-images-secret-01234567890123456789','db'=>['driver'=>'sqlite','sqlite_path'=>" + php_path(tmp / 'test.db') + "]];", encoding='utf8')
    env = dict(os.environ, HDM_CONFIG_FILE=str(cfg))
    def run(name):
        return subprocess.run([PHP, str(ROOT / 'backend-php' / name)], env=env, capture_output=True, text=True, check=True).stdout
    run('migrate.php')
    run('load_seed_data.php')
    conn = sqlite3.connect(tmp / 'test.db')
    def counts():
        return {t: conn.execute('SELECT COUNT(*) FROM ' + t).fetchone()[0] for t in ['blog_posts', 'maquinarias', 'repuestos', 'novedades', 'promociones']}
    initial = counts()
    expect(initial['blog_posts'] == 6 and initial['maquinarias'] == 3 and initial['repuestos'] == 4802, 'initial catalogue preserved')
    for table in ['blog_posts', 'maquinarias', 'novedades', 'promociones']:
        images = [r[0] for r in conn.execute('SELECT imagen FROM ' + table)]
        expect(all(p and p.startswith('/') and (ROOT / 'public' / p.lstrip('/')).is_file() for p in images), table + ' starts with existing local images')
    run('load_seed_data.php')
    expect(counts() == initial, 'loading twice does not duplicate records')
    conn.execute("UPDATE blog_posts SET imagen = '/api/uploads/my-blog.jpg' WHERE id = 1")
    conn.execute("UPDATE blog_posts SET imagen = NULL WHERE id = 2")
    conn.execute("UPDATE blog_posts SET imagen = '' WHERE id = 3")
    conn.execute("UPDATE maquinarias SET imagen = 'https://commons.wikimedia.org/wiki/Special:FilePath/CAT%20320.excavator.jpg?width=900' WHERE nombre = 'Excavadora Hidráulica 320D'")
    conn.execute("UPDATE maquinarias SET imagen = 'https://example.test/custom.jpg' WHERE nombre = 'Excavadora PC200-8'")
    conn.execute("UPDATE maquinarias SET imagen = 'https://commons.wikimedia.org/wiki/Special:FilePath/Custom.jpg' WHERE nombre = 'Excavadora ZX210'")
    conn.commit()
    run('repair_seed_images.php')
    expect(conn.execute('SELECT imagen FROM blog_posts WHERE id=1').fetchone()[0] == '/api/uploads/my-blog.jpg', 'custom blog image preserved')
    expect(conn.execute('SELECT imagen FROM blog_posts WHERE id=2').fetchone()[0] == '/blogs/blog4.jpg', 'NULL image repaired')
    expect(conn.execute('SELECT imagen FROM blog_posts WHERE id=3').fetchone()[0] == '/blogs/blog3.jpg', 'empty image repaired')
    expect(conn.execute("SELECT imagen FROM maquinarias WHERE nombre='Excavadora Hidráulica 320D'").fetchone()[0] == '/maquinaria/referencias/cat-320d.jpg', 'known legacy remote image replaced by bundled photo')
    expect(conn.execute("SELECT imagen FROM maquinarias WHERE nombre='Excavadora PC200-8'").fetchone()[0] == 'https://example.test/custom.jpg', 'custom machine image preserved')
    expect(conn.execute("SELECT imagen FROM maquinarias WHERE nombre='Excavadora ZX210'").fetchone()[0].endswith('Custom.jpg'), 'unknown Commons image preserved')
    run('repair_seed_images.php')
    expect(counts() == initial, 'repair repeated without inserting inventory')
    conn.execute('DELETE FROM blog_posts WHERE id=6'); conn.commit()
    run('repair_seed_images.php')
    expect(conn.execute('SELECT COUNT(*) FROM blog_posts').fetchone()[0] == 5, 'repair does not recreate removed content')
    run('add_placeholder_maquinaria.php')
    expect(conn.execute('SELECT COUNT(*) FROM maquinarias').fetchone()[0] == 10, 'optional examples remain opt-in')
    expect(all((ROOT / 'public' / row[0].lstrip('/')).is_file() for row in conn.execute("SELECT imagen FROM maquinarias WHERE nombre LIKE '%(ejemplo)'")), 'all optional examples have bundled photos')
    run('add_placeholder_maquinaria.php')
    expect(conn.execute('SELECT COUNT(*) FROM maquinarias').fetchone()[0] == 10, 'optional examples remain repeatable')
    conn.close()
print(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False, indent=2))
