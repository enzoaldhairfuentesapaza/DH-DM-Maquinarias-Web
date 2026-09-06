import { novedades, promociones } from "../src/data/novedadesPromociones";
import { blogPosts } from "../src/data/blog";
import { maquinarias } from "../src/data/maquinaria";
import fs from "fs";

fs.mkdirSync("scripts/out", { recursive: true });
fs.writeFileSync("scripts/out/novedades.json", JSON.stringify(novedades, null, 2));
fs.writeFileSync("scripts/out/promociones.json", JSON.stringify(promociones, null, 2));
fs.writeFileSync("scripts/out/blog.json", JSON.stringify(blogPosts, null, 2));
fs.writeFileSync("scripts/out/maquinaria.json", JSON.stringify(maquinarias, null, 2));

console.log("Exportado: novedades, promociones, blog, maquinaria -> scripts/out/*.json");
