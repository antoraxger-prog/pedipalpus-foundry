import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { fixture, combatFixture, retinueFixture, npcFixture } from '../tests/fixture.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PEDIPALPUS_PLAYWRIGHT || 'playwright');
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const checksVersion = process.env.PEDIPALPUS_CHECKS_VERSION || '1.0.14';
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.2 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
const uploadedImages = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if(url.pathname==='/preview-upload' && request.method==='POST'){
      const target=url.searchParams.get('path');if(!/^worlds\/test-world\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/.test(target??''))throw new Error('Invalid upload');
      const chunks=[];for await(const chunk of request)chunks.push(chunk);uploadedImages.set('/'+target,Buffer.concat(chunks));return response.end('Uploaded');
    }
    if(url.pathname==='/icons/svg/mystery-man.svg'){response.setHeader('Content-Type','image/svg+xml');return response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e634c"/><circle cx="32" cy="23" r="12" fill="#d6c5a1"/><path d="M10 64V54c0-24 44-24 44 0v10" fill="#d6c5a1"/></svg>');}
    if(uploadedImages.has(url.pathname)){response.setHeader('Content-Type','image/png');return response.end(uploadedImages.get(url.pathname));}
    if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); return response.end(pageHTML); }
    let target;
    if (url.pathname === '/checks-reference.js') target = fileURLToPath(new URL(`../../pedipalpus-checks/ucurifunke-v${checksVersion}/${checksVersion === '1.0.8' ? 'ucurifunke-checks/' : ''}scripts/ucurifunke-checks.js`, import.meta.url));
    else { target = path.resolve(root, '.' + url.pathname); if (!target.startsWith(root + path.sep)) throw new Error('Invalid path'); }
    response.setHeader('Content-Type', target.endsWith('.wav') ? 'audio/wav' : target.endsWith('.svg') ? 'image/svg+xml' : target.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.end(await fs.readFile(target));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
 await page.evaluate(async raw=>{
  const {normalizeCharacter}=await import('/scripts/data.js'),{PedipalpusApp}=await import('/scripts/app.js');
  const create=async(name)=>{const data={...raw,Name:name};return foundry.documents.Actor.create({name,type:'character',img:'icons/svg/mystery-man.svg',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(data),sourceJSON:JSON.stringify(data)}}}});};
  window.sessionHero=await create('Testfigur A');window.sessionOther=await create('Testfigur B');
  window.sessionA=Array.from(foundry.applications.api.ApplicationV2.instances())[0];await sessionA.open(sessionHero.id);
  window.sessionB=new PedipalpusApp({id:'session-b'});await sessionB.open(sessionHero.id);
 },retinueFixture());
 await page.evaluate(async()=>{
  const {toggleFavorite,loadWorkbench}=await import('/scripts/workbench.js'),character=sessionHero.getFlag('pedipalpus-foundry','character');
  await sessionA.persist(toggleFavorite(sessionA.preferences,sessionHero.id,character.checks.find(row=>row.name==='Mut')));
  await sessionB.persist(toggleFavorite(sessionB.preferences,sessionHero.id,character.checks.find(row=>row.name==='Klugheit')));
  const stored=loadWorkbench();if(stored.favorites[sessionHero.id].length!==2)throw new Error('Favorite was lost');
  await sessionA.persist({...sessionA.preferences,volume:.1});if(loadWorkbench().favorites[sessionHero.id].length!==2)throw new Error('Unrelated setting replaced favorites');
 });
 console.log('PASS: Two windows keep independent favorites and unrelated display preferences instead of replacing each other.');
 await page.evaluate(async()=>{
  const {figurePreferences}=await import('/scripts/play-tools.js');
  await sessionA.persist({...sessionA.preferences,figures:{...sessionA.preferences.figures,[sessionHero.id]:{...figurePreferences(sessionA.preferences,sessionHero.id),rememberTheme:true,theme:'fantasy'}}});await sessionA.render();
  sessionA.designSave=new Promise(resolve=>window.releaseTheme=resolve);
  const theme=sessionA.element.querySelector('[name="theme"]');theme.value='ork';theme.dispatchEvent(new Event('change',{bubbles:true}));
  sessionA.selectActor(sessionOther.id);await sessionA.render();releaseTheme();await sessionA.designSave;
  const {loadWorkbench}=await import('/scripts/workbench.js'),prefs=loadWorkbench();
  if(prefs.figures[sessionHero.id].theme!=='ork'||prefs.figures[sessionOther.id]?.rememberTheme)throw new Error('Theme saved for wrong figure');
 });
 console.log('PASS: A delayed figure-theme save remains attached to the original figure after a character change.');
 await page.evaluate(async()=>{
  const content=sessionA.element.querySelector('.window-content');
  for(let i=0;i<5;i++)sessionA._replaceHTML(await sessionA._renderHTML(),content);
  const filter=sessionA.filterChecks.bind(sessionA);let calls=0;sessionA.filterChecks=(...args)=>{calls++;return filter(...args);};
  const search=content.querySelector('[name="search"]');search.value='Test';sessionA.search='Test';search.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Escape'}));
  if(calls!==1)throw new Error(`Keyboard handler ran ${calls} times`);
  sessionA.filterChecks=filter;
 });
 console.log('PASS: Replacing content repeatedly installs exactly one search-keyboard handler.');
 await page.evaluate(async()=>{
  const {toggleFavorite,loadWorkbench}=await import('/scripts/workbench.js'),character=sessionHero.getFlag('pedipalpus-foundry','character');
  await sessionB.persist(toggleFavorite(sessionB.preferences,sessionHero.id,character.checks.find(row=>row.name==='Mut')));
  await sessionA.persist({...sessionA.preferences,textScale:110});
  const stored=loadWorkbench();if(stored.favorites[sessionHero.id].some(ref=>ref.name==='Mut'))throw new Error('Removed favorite returned');
 });
 console.log('PASS: A favorite removed in one window is not resurrected by an unrelated save in an older window.');
 assert.deepEqual(errors,[]);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
