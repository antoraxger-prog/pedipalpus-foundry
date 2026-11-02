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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.16 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);




 const raw=retinueFixture();raw.AcademicSkills[0].Subskills=[{Name:'Wissen 00',TotalValue:8,Description:'Regeltext für die erste Probe.'},{Name:'Selbstbeherrschung',TotalValue:5},{Name:'AußergewöhnlichLangerFähigkeitsname',TotalValue:10}];
 await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});window.spacingActor=actor;window.spacingBefore=JSON.stringify(actor.flags);window.spacingApp=await game.modules.get('pedipalpus-foundry').api.open(actor.id);await spacingApp.persist({...spacingApp.preferences,animations:'none',sound:false});await spacingApp.render();},raw);
 const idle=()=>page.waitForFunction(()=>!spacingApp.busy&&!spacingApp.referenceBusy);const measure=()=>page.evaluate(()=>[...document.querySelectorAll('.pp-check-row:not([hidden]) .pp-name-cell')].filter(cell=>cell.checkVisibility()).flatMap(cell=>{const name=cell.querySelector('.pp-check-name'),info=cell.querySelector('.pp-info-button');if(!info)return [];const a=name.getBoundingClientRect(),b=info.getBoundingClientRect();return [{name:name.textContent.trim(),right:a.right,infoLeft:b.left,padding:getComputedStyle(cell).paddingRight,overlap:a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom}];}));
 const fits=async()=>{const rows=await measure(),overlaps=rows.filter(row=>row.overlap);if(overlaps.length){await page.screenshot({path:path.resolve(root,'../artifacts/name-spacing-failure.png')});}assert.deepEqual(overlaps,[]);};
 await page.locator('[name="category"]').selectOption('AcademicSkills');for(const width of [900,500,412])for(const textScale of [100,130]){await page.setViewportSize({width,height:1000});await page.evaluate(async textScale=>{await spacingApp.persist({...spacingApp.preferences,textScale});await spacingApp.render();},textScale);await fits();}
 console.log('PASS: Short, long and unbroken skill names stay separate from info buttons at three widths and normal/enlarged text sizes.');
 for(const theme of ['fantasy','dark','light','ork','demonic','aristocrat','warrior','arcane','sneaky']){await page.evaluate(async theme=>{await (await import('/scripts/design.js')).saveDesign(theme);await spacingApp.render();},theme);await fits();assert.equal(await page.locator('.pp-root').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);}
 await page.screenshot({path:path.resolve(root,'../artifacts/name-spacing-1.11.16.png')});
 console.log('PASS: All nine designs preserve reserved name/info space in a narrow window, including Ork original-name subtitles.');
 await page.evaluate(async()=>{await (await import('/scripts/design.js')).saveDesign('fantasy');await spacingApp.render();});const info=page.locator('[data-check-id="AcademicSkills:0:0"] .pp-info-button');await info.click();assert.match(await page.locator('.mock-dialog').innerText(),/Regeltext für die erste Probe/);await page.locator('[name="abilityNote"]').fill('Eigene Notiz');await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.equal(await info.getAttribute('data-has-note'),'true');await fits();const before=await page.evaluate(()=>testMessages.length);await page.locator('[data-check-id="AcademicSkills:0:0"] .pp-check-name').click();await idle();assert.equal(await page.evaluate(()=>testMessages.length),before+1);assert.match(await page.evaluate(()=>testMessages.at(-1).content),/Wissen 00/);
 console.log('PASS: Info still opens the correct source rules and saves personal notes; clicking the neighboring name submits exactly its normal roll.');
 await page.locator('[data-action="battle"]').click();await idle();await page.locator('[data-action="expand-companions"]').click();await idle();await fits();assert.ok((await measure()).length>20);await page.locator('[data-action="full"]').click();await idle();await fits();
 console.log('PASS: Combat action names and expanded animal/demon/undead rows use the same safe spacing, and returning to ordinary probes preserves it.');
 await page.evaluate(async()=>{spacingActor.isOwner=false;spacingActor.canUserModify=()=>false;await spacingApp.render();});await info.click();assert.equal(await page.locator('[name="abilityNote"]').inputValue(),'Eigene Notiz');await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(spacingActor.flags)),await page.evaluate(()=>spacingBefore));assert.deepEqual(errors,[]);
 console.log('PASS: Observers retain readable info without dice permissions; character flags stay unchanged and all browser checks finish without page errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
