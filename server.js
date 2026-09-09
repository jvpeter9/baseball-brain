import http from 'node:http';
import {readFile} from 'node:fs/promises';
import handler from './api/game.js';
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/model.js':'model.js','/scenarios.json':'scenarios.json'};
const mime={html:'text/html',css:'text/css',js:'text/javascript',json:'application/json'};
http.createServer(async(req,res)=>{
 res.status=code=>{res.statusCode=code;return res;};res.json=value=>res.end(JSON.stringify(value));
 try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/game'){
  res.setHeader('Content-Type','application/json');let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){res.status(413).json({error:'Request too large'});return;}}
  try{req.body=body?JSON.parse(body):{};}catch{return res.status(400).json({error:'Invalid JSON'});}return await handler(req,res);
 }
 const file=files[url.pathname];if(!file){res.statusCode=404;return res.end('Not found');}res.setHeader('Content-Type',mime[file.split('.').pop()]+'; charset=utf-8');res.end(await readFile(new URL(file,import.meta.url)));
 }catch{res.statusCode=500;res.end('Server error');}
}).listen(Number(process.env.PORT||5180),'127.0.0.1',()=>console.log('Baseball Brain: http://127.0.0.1:5180'));
