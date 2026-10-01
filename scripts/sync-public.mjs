import {cpSync,mkdirSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const frontend=path.join(root,"frontend");
mkdirSync(frontend,{recursive:true});
for(const folder of ["app","public"]){
  rmSync(path.join(frontend,folder),{recursive:true,force:true});
  cpSync(path.join(root,folder),path.join(frontend,folder),{recursive:true});
}
mkdirSync(path.join(frontend,"worker"),{recursive:true});
cpSync(path.join(root,"worker/expense-api.ts"),path.join(frontend,"worker/expense-api.ts"));
for(const file of ["package.json","package-lock.json","postcss.config.mjs","next.config.ts","vercel.json"])
  cpSync(path.join(root,file),path.join(frontend,file));
const config=JSON.parse(readFileSync(path.join(root,"tsconfig.json"),"utf8"));
config.include=["next-env.d.ts","app/**/*.ts","app/**/*.tsx",".next/types/**/*.ts",".next/dev/types/**/*.ts"];
config.exclude=["node_modules"];
writeFileSync(path.join(frontend,"tsconfig.json"),JSON.stringify(config,null,2)+"\n");
console.log("Synced the standalone public Vercel build from the canonical application.");
