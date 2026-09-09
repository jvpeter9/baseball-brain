import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','model.js','scenarios.json'])await copyFile(file,'dist/'+file);
