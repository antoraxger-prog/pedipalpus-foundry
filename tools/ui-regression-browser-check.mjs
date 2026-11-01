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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.0 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
try {
  browser=await chromium.launch({headless:true,...(process.env.PEDIPALPUS_BROWSER?{executablePath:process.env.PEDIPALPUS_BROWSER}:{})});
  const page=await browser.newPage({viewport:{width:1460,height:1000}});
  await page.addInitScript(()=>{
    window.previewAudioEvents=[];
    window.previewSamples=[];
    const create=AudioContext.prototype.createGain;
    AudioContext.prototype.createGain=function(){
      const gain=create.call(this),set=gain.gain.setValueAtTime.bind(gain.gain);
      gain.gain.setValueAtTime=(value,time)=>{previewAudioEvents.push(value);return set(value,time);};
      return gain;
    };
    const makeSource=AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource=function(){
      const source=makeSource.call(this),start=source.start.bind(source);
      source.start=(...args)=>{if(source.buffer)previewSamples.push(source.buffer.duration);return start(...args);};return source;
    };
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
  const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
  const raw=retinueFixture();raw.Animals[0].KarmaEnergy=8;raw.Animals[0].CurrentKarmaEnergy=3;
  const actorId=await page.evaluate(async raw=>{
    const {normalizeCharacter}=await import('/scripts/data.js');
    const character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
    const actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',img:'icons/svg/mystery-man.svg',prototypeToken:{texture:{src:'icons/svg/mystery-man.svg'}},flags:{'pedipalpus-foundry':{character}}});
    await game.modules.get('pedipalpus-foundry').api.open(actor.id);return actor.id;
  },raw);
  const check=page.locator('[data-check-id="AcademicSkills:0:0"]');
  await check.locator('[data-action="favorite"]').click();await idle();
  const drag=await page.locator('.pp-quick-check .pp-check-name').evaluate(element=>{
    const dataTransfer=new DataTransfer(),event=new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer});
    element.dispatchEvent(event);const payload=dataTransfer.getData('text/plain');element.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer}));return {prevented:event.defaultPrevented,payload};
  });
  assert.equal(drag.prevented,false);const payload=JSON.parse(drag.payload);assert.equal(payload.type,'PedipalpusCheck');assert.equal(payload.actorId,actorId);assert.equal(payload.reference.name,'Geographie');
  await page.evaluate(payload=>Hooks.call('hotbarDrop',null,payload,3),payload);await page.waitForFunction(()=>testMacros.length===1&&testHotbar.length===1);assert.equal(await page.evaluate(()=>testHotbar[0].slot),3);
  console.log('PASS: Dragging a favorite from the quickbar provides a live check reference and creates the requested hotbar macro.');
  await page.locator('[data-action="battle"]').click();await idle();await page.locator('[name="category"]').selectOption('animals');
  assert.equal(await page.locator('.pp-companion-section[open]').count(),0);await page.locator('[name="search"]').focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement.closest('.pp-companion-quick')!==null),true);
  assert.equal(await page.locator('.pp-companion-section[open]').count(),0);
  console.log('PASS: ArrowDown from search focuses a visible quick roll for a closed companion rather than an invisible table action.');
  await page.locator('.pp-companion-section:not([hidden]) > summary > strong').click();assert.match(await page.locator('.pp-companion-section:not([hidden]) .pp-companion-content').innerText(),/KE 3 \/ 8/);
  await page.getByRole('button',{name:'Energien von Skelett bearbeiten',exact:true}).click();assert.equal(await page.locator('[data-energy="KE"]').inputValue(),'3');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
  console.log('PASS: Companion karma energy is displayed beside astral energy and remains available in the scoped energy editor.');
  await page.evaluate(async id=>{
    const actor=game.actors.get(id),canvas=document.createElement('canvas');canvas.width=canvas.height=64;const context=canvas.getContext('2d');context.fillStyle='#4f7a95';context.fillRect(0,0,64,64);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const {preparePortrait,uploadPortrait,applyPortrait,framingFor}=await import('/scripts/portraits.js');const {prepareTokenPortrait}=await import('/scripts/tokens.js');
    const framed=await prepareTokenPortrait(await preparePortrait(new File([blob],'Synthetic.png',{type:'image/png'})),'concrete');
    await applyPortrait(actor,await uploadPortrait(framed),()=>{},await uploadPortrait(framed.token),framingFor(framed));
  },actorId);
  if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="preferences"]').click();
  await page.evaluate(id=>{
    const picker=foundry.applications.apps.FilePicker.implementation,native=picker.upload;window.refreshRaceChanged=false;
    picker.upload=async(...args)=>{const result=await native(...args);if(!window.refreshRaceChanged){window.refreshRaceChanged=true;const actor=game.actors.get(id);actor.img='icons/svg/mystery-man.svg';actor.flags['pedipalpus-foundry'].portraitFraming={style:'undead',x:.25,y:.75,zoom:2};actor.prototypeToken.texture.src='concurrent-token.png';}return result;};
  },actorId);
  await page.locator('[data-token-refresh]').click();await page.waitForFunction(()=>document.querySelector('[data-frame-status]')?.textContent.includes('inzwischen'));
  const after=await page.evaluate(id=>{const actor=game.actors.get(id);return {image:actor.img,framing:actor.getFlag('pedipalpus-foundry','portraitFraming'),token:actor.prototypeToken.texture.src};},actorId);
  assert.deepEqual(after,{image:'icons/svg/mystery-man.svg',framing:{style:'undead',x:.25,y:.75,zoom:2},token:'concurrent-token.png'});
  await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.deepEqual(errors,[]);
  console.log('PASS: Token refresh rejects a portrait or crop changed during upload and preserves the newer portrait, framing and token.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
