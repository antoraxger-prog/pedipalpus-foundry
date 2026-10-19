import {TOKEN_STYLES,DEFAULT_CROP,normalizeCrop,portraitGeometry,createTokenRenderer} from './tokens.js';
import {preparePortrait} from './portraits.js';
import {escapeHTML as e} from './view.js';
export function portraitEditorHTML(style='concrete'){
 return `<div class="pp-portrait-editor"><label>Bilddatei<input name="portraitFile" type="file" accept=".png,.jpg,.jpeg,.bmp,.webp"></label><label>Tokenrahmen<select name="tokenFrame">${TOKEN_STYLES.map(([key,label])=>`<option value="${key}" ${key===style?'selected':''}>${e(label)}</option>`).join('')}</select></label><div class="pp-crop-stage"><canvas width="512" height="512" tabindex="0" role="img" aria-label="Bildausschnitt. Bild mit der Maus verschieben oder Pfeiltasten verwenden."></canvas></div><p class="pp-hint">Bild im Rahmen ziehen. Zum Vergrößern den Regler verwenden.</p><label>Vergrößerung<input type="range" name="portraitZoom" min="1" max="3" step="0.05" value="1"><output data-crop-zoom>100 %</output></label><button type="button" data-crop-reset>Ausschnitt zurücksetzen</button><p class="pp-portrait-preview" role="status">Bild auswählen oder vorhandenes Bild ausrichten.</p></div>`;
}
export class PortraitEditor{
 constructor(root,{style='concrete',crop=DEFAULT_CROP,onState=()=>{}}={}){
  this.root=root;this.canvas=root.querySelector('.pp-crop-stage canvas');this.style=style;this.crop=normalizeCrop(crop);this.onState=onState;this.sequence=0;this.closed=false;this.ready=false;this.events=new AbortController();
  const listen=(element,type,fn)=>element.addEventListener(type,fn,{signal:this.events.signal});
  listen(root.querySelector('[name="portraitFile"]'),'change',event=>this.load(()=>preparePortrait(event.target.files?.[0]),DEFAULT_CROP));
  listen(root.querySelector('[name="tokenFrame"]'),'change',event=>{this.style=event.target.value;if(this.portrait)this.load(()=>this.portrait,this.crop);});
  listen(root.querySelector('[name="portraitZoom"]'),'input',event=>{if(!this.ready)return;this.crop={...this.crop,zoom:Number(event.target.value)};this.draw();});
  listen(root.querySelector('[data-crop-reset]'),'click',()=>{if(this.ready){this.crop={...DEFAULT_CROP};this.draw();}});
  listen(this.canvas,'pointerdown',event=>{if(!this.ready||event.button!==0)return;event.preventDefault();this.canvas.focus();this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,crop:{...this.crop}};this.canvas.setPointerCapture(event.pointerId);this.canvas.classList.add('pp-dragging');});
  listen(this.canvas,'pointermove',event=>{if(this.drag?.id!==event.pointerId||!this.ready)return;const box=this.canvas.getBoundingClientRect();this.move((event.clientX-this.drag.x)*512/box.width,(event.clientY-this.drag.y)*512/box.height,this.drag.crop);});
  const finish=event=>{if(this.drag?.id!==event.pointerId)return;this.drag=null;this.canvas.classList.remove('pp-dragging');if(this.canvas.hasPointerCapture(event.pointerId))this.canvas.releasePointerCapture(event.pointerId);};
  listen(this.canvas,'pointerup',finish);listen(this.canvas,'pointercancel',finish);listen(this.canvas,'lostpointercapture',finish);
  listen(this.canvas,'keydown',event=>{const step=event.shiftKey?32:8,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];if(delta&&this.ready){event.preventDefault();this.move(...delta,this.crop);}});
 }
 state(busy,message=''){
  this.root.querySelector('[name="tokenFrame"]').disabled=busy;
  this.root.querySelector('[name="portraitZoom"]').disabled=!this.ready;
  this.root.querySelector('[data-crop-reset]').disabled=!this.ready;
  if(message)this.root.querySelector('.pp-portrait-preview').textContent=message;
  this.onState({ready:this.ready,busy,message});
 }
 async load(loader,crop=this.crop){
  const sequence=++this.sequence;this.ready=false;this.drag=null;this.state(true,'Bild wird geladen …');
  try{
   const portrait=await loader();if(sequence!==this.sequence||this.closed)return;
   const renderer=await createTokenRenderer(portrait,this.style);
   if(sequence!==this.sequence||this.closed){renderer.destroy();return;}
   this.renderer?.destroy();this.renderer=renderer;this.portrait=portrait;this.crop=normalizeCrop(crop);this.ready=true;this.draw();this.state(false,/^[a-f0-9]{64}\./.test(portrait.file.name)?'Vorhandenes Bild wird verwendet.':`Bild ausgewählt: ${portrait.file.name}`);
  }catch(error){if(sequence===this.sequence&&!this.closed){this.ready=false;this.state(false,error.message);}}
 }
 move(dx,dy,initial){
  const rect=portraitGeometry(this.renderer.width,this.renderer.height,initial),clamp=value=>Math.max(-1,Math.min(1,value));
  this.crop={...initial,x:rect.width>512?clamp(initial.x+2*dx/(rect.width-512)):0,y:rect.height>512?clamp(initial.y+2*dy/(rect.height-512)):0};this.draw();
 }
 draw(){
  if(!this.ready)return;this.renderer.draw(this.canvas,this.crop);this.root.querySelector('[name="portraitZoom"]').value=String(this.crop.zoom);this.root.querySelector('[data-crop-zoom]').textContent=`${Math.round(this.crop.zoom*100)} %`;
 }
 value(){if(!this.ready)throw new Error('Bitte warten, bis ein gültiges Bild angezeigt wird.');return {portrait:this.portrait,style:this.style,crop:{...this.crop}};}
 destroy(){this.closed=true;this.sequence++;this.events.abort();this.renderer?.destroy();}
}
