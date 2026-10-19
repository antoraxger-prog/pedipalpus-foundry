import {tokenStyles,importCustomFrame,DEFAULT_CROP,normalizeCrop,portraitWindowGeometry,createTokenRenderer} from './tokens.js';
import {preparePortrait} from './portraits.js';
import {escapeHTML as e} from './view.js';
export function portraitEditorHTML(style='concrete',frame=null){
 return `<div class="pp-portrait-editor"><label>Bilddatei<input name="portraitFile" type="file" accept=".png,.jpg,.jpeg,.bmp,.webp"></label><label>Tokenrahmen<select name="tokenFrame">${tokenStyles(frame).map(([key,label])=>`<option value="${key}" ${key===style?'selected':''}>${e(label)}</option>`).join('')}</select></label>${customFrameImportHTML()}<div class="pp-crop-stage"><canvas width="512" height="512" tabindex="0" role="img" aria-label="Bildausschnitt. Bild mit der Maus verschieben oder Pfeiltasten verwenden."></canvas></div><p class="pp-hint">Bild im Rahmen ziehen. Zum Vergrößern den Regler verwenden.</p><label>Vergrößerung<input type="range" name="portraitZoom" min="1" max="3" step="0.05" value="1"><output data-crop-zoom>100 %</output></label><button type="button" data-crop-reset>Ausschnitt zurücksetzen</button><p class="pp-portrait-preview" role="status">Bild auswählen oder vorhandenes Bild ausrichten.</p></div>`;
}
export function customFrameImportHTML(){return '<details class="pp-custom-frame-import"><summary>Eigenen Rahmen hinzufügen</summary><label>Rahmenbild<input name="customFrameFile" type="file" accept=".png,.webp,image/png,image/webp"></label><p class="pp-hint pp-custom-frame-hint">Transparentes PNG oder WebP mit geschlossenem Rand und freier Mitte. Rechteckige Bilder sind möglich. Neue Rahmen bleiben für spätere Verwendung gespeichert.</p><p data-custom-frame-status role="status"></p></details>';}
export function fillFrameOptions(select,selected,frame=null){select.innerHTML=tokenStyles(frame).map(([id,name])=>`<option value="${e(id)}" ${id===selected?'selected':''}>${e(name)}</option>`).join('');}
export class PortraitEditor{
 constructor(root,{style='concrete',crop=DEFAULT_CROP,onState=()=>{}}={}){
  this.root=root;this.canvas=root.querySelector('.pp-crop-stage canvas');this.style=style;this.crop=normalizeCrop(crop);this.frame=crop?.frame??null;this.onState=onState;this.sequence=0;this.closed=false;this.ready=false;this.events=new AbortController();
  const listen=(element,type,fn)=>element.addEventListener(type,fn,{signal:this.events.signal});
  listen(root.querySelector('[name="customFrameFile"]'),'change',event=>this.addFrame(event.target.files?.[0]));
  listen(root.querySelector('[name="portraitFile"]'),'change',event=>this.load(()=>preparePortrait(event.target.files?.[0]),DEFAULT_CROP));
  listen(root.querySelector('[name="tokenFrame"]'),'change',event=>{this.style=event.target.value;if(this.portrait)this.load(()=>this.portrait,this.crop);});
  listen(root.querySelector('[name="portraitZoom"]'),'input',event=>{if(!this.ready)return;this.crop={...this.crop,zoom:Number(event.target.value)};this.draw();});
  listen(root.querySelector('[data-crop-reset]'),'click',()=>{if(this.ready){this.crop={...DEFAULT_CROP};this.draw();}});
  listen(this.canvas,'pointerdown',event=>{if(!this.ready||event.button!==0)return;event.preventDefault();this.canvas.focus();this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,crop:{...this.crop,...(this.frame?{frame:this.frame}:{})}};this.canvas.setPointerCapture(event.pointerId);this.canvas.classList.add('pp-dragging');});
  listen(this.canvas,'pointermove',event=>{if(this.drag?.id!==event.pointerId||!this.ready)return;const box=this.canvas.getBoundingClientRect();this.move((event.clientX-this.drag.x)*512/box.width,(event.clientY-this.drag.y)*512/box.height,this.drag.crop);});
  const finish=event=>{if(this.drag?.id!==event.pointerId)return;this.drag=null;this.canvas.classList.remove('pp-dragging');if(this.canvas.hasPointerCapture(event.pointerId))this.canvas.releasePointerCapture(event.pointerId);};
  listen(this.canvas,'pointerup',finish);listen(this.canvas,'pointercancel',finish);listen(this.canvas,'lostpointercapture',finish);
  listen(this.canvas,'keydown',event=>{const step=event.shiftKey?32:8,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];if(delta&&this.ready){event.preventDefault();this.move(...delta,this.crop);}});
 }
 state(busy,message=''){
  this.root.querySelector('[name="tokenFrame"]').disabled=busy||Boolean(this.importingFrame);
  this.root.querySelector('[name="customFrameFile"]').disabled=Boolean(this.importingFrame);
  this.root.querySelector('[name="portraitZoom"]').disabled=!this.ready||Boolean(this.importingFrame);
  this.root.querySelector('[data-crop-reset]').disabled=!this.ready;
  if(message)this.root.querySelector('.pp-portrait-preview').textContent=message;
  this.onState({ready:this.ready&&!this.importingFrame,busy:busy||Boolean(this.importingFrame),message});
 }
 async load(loader,crop=this.crop){
  this.loader=loader;
  const sequence=++this.sequence;this.ready=false;this.drag=null;this.state(true,'Bild wird geladen …');
  try{
   const portrait=await loader();if(sequence!==this.sequence||this.closed)return;
   const renderer=await createTokenRenderer(portrait,this.style,this.frame);
   if(sequence!==this.sequence||this.closed){renderer.destroy();return;}
   this.renderer?.destroy();this.renderer=renderer;this.frame=renderer.customFrame??null;this.portrait=portrait;this.crop=normalizeCrop(crop);this.ready=true;this.draw();this.state(false,/^[a-f0-9]{64}\./.test(portrait.file.name)?'Vorhandenes Bild wird verwendet.':`Bild ausgewählt: ${portrait.file.name}`);
  }catch(error){if(sequence===this.sequence&&!this.closed){this.ready=false;this.state(false,error.message);}}
 }
 move(dx,dy,initial){
  const area=this.renderer.area,rect=portraitWindowGeometry(this.renderer.width,this.renderer.height,initial,area),clamp=value=>Math.max(-1,Math.min(1,value));
  this.crop={...initial,x:rect.width>area.width?clamp(initial.x+2*dx/(rect.width-area.width)):0,y:rect.height>area.height?clamp(initial.y+2*dy/(rect.height-area.height)):0};this.draw();
 }
 draw(){
  if(!this.ready)return;this.renderer.draw(this.canvas,this.crop);this.root.querySelector('[name="portraitZoom"]').value=String(this.crop.zoom);this.root.querySelector('[data-crop-zoom]').textContent=`${Math.round(this.crop.zoom*100)} %`;
 }
 value(){if(!this.ready||this.importingFrame)throw new Error('Bitte warten, bis ein gültiges Bild angezeigt wird.');return {portrait:this.portrait,style:this.style,crop:{...this.crop,...(this.frame?{frame:this.frame}:{})}};}
 async addFrame(file){
  if(this.importingFrame||!file)return;this.importingFrame=true;this.sequence++;this.ready=false;this.state(true,'Rahmen wird gespeichert …');const status=this.root.querySelector('[data-custom-frame-status]');
  try{const frame=await importCustomFrame(file);if(this.closed)return;this.frame=frame;this.style=frame.id;fillFrameOptions(this.root.querySelector('[name="tokenFrame"]'),frame.id,frame);status.textContent=`Rahmen gespeichert: ${frame.name}`;
  }catch(error){if(!this.closed)status.textContent=error.message;}
  finally{this.importingFrame=false;if(!this.closed){if(this.loader)await this.load(this.loader,this.crop);else this.state(false,'Bitte ein Bild auswählen.');}}
 }
 destroy(){this.closed=true;this.sequence++;this.events.abort();this.renderer?.destroy();}
}
