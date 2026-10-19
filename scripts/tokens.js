import { MODULE_ID } from './data.js';
import { preparePortrait, uploadPortrait } from './portraits.js';
import { readFramePackage } from './bundle.js';

import {TOKEN_STYLES,tokenStyles,customFrameFor,registerCustomFrames} from './custom-frames.js';
export {TOKEN_STYLES,tokenStyles,customFrameFor,importCustomFrame} from './custom-frames.js';
const known=(style,extra=null)=>TOKEN_STYLES.some(([key])=>key===style)||Boolean(customFrameFor(style,extra));
export function registerTokenSettings(){game.settings.register(MODULE_ID,'tokenFrames',{scope:'world',config:false,type:Object,default:{}});registerCustomFrames();}
export function savedFrames(){try{return game.settings.get(MODULE_ID,'tokenFrames')??{};}catch{return {};}}
const localPath=path=>typeof path==='string'&&/^worlds\/[A-Za-z0-9_-]+\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/.test(path);
async function loadBitmap(path){if(!localPath(path))throw new Error('Der gespeicherte Tokenrahmen ist ungültig.');const response=await fetch(path);if(!response.ok)throw new Error('Der Tokenrahmen konnte nicht geladen werden.');return createImageBitmap(await response.blob());}

export async function importTokenFrames(file){
 if(!game.user.isGM)throw new Error('Die Originalrahmen kann dein Spielleiter einmal für die Welt importieren.');
 const files=await readFramePackage(file),paths={};
 for(const [style,pair] of Object.entries(files)){
  const overlay=await preparePortrait(pair.overlay),mask=await preparePortrait(pair.mask);
  const a=await createImageBitmap(overlay.file),b=await createImageBitmap(mask.file);
  try{if(a.width!==a.height||a.width!==b.width||a.height!==b.height||a.width>2048)throw new Error('Rahmen und Maske müssen gleich groß und quadratisch sein.');}
  finally{a.close();b.close();}
  paths[style]={overlay:await uploadPortrait(overlay),mask:await uploadPortrait(mask)};
 }
 await game.settings.set(MODULE_ID,'tokenFrames',paths);return paths;
}

export const DEFAULT_CROP=Object.freeze({x:0,y:0,zoom:1});
export function normalizeCrop(value={}){
 const crop={x:value?.x??0,y:value?.y??0,zoom:value?.zoom??1};
 if(!Object.values(crop).every(Number.isFinite)||Math.abs(crop.x)>1||Math.abs(crop.y)>1||crop.zoom<1||crop.zoom>3)throw new Error('Der Bildausschnitt ist ungültig. Bitte erneut ausrichten.');
 return crop;
}
export function savedPortraitFraming(actor){
 try{const value=actor?.getFlag(MODULE_ID,'portraitFraming');if(!value)return null;const frame=customFrameFor(value.style,value.frame);return {...normalizeCrop(value),style:known(value.style,frame)?value.style:'concrete',...(frame?{frame}:{})};}catch{return null;}
}
export function portraitGeometry(width,height,crop=DEFAULT_CROP,size=512){return portraitWindowGeometry(width,height,crop,{x:0,y:0,width:size,height:size});}
export function portraitWindowGeometry(width,height,crop=DEFAULT_CROP,area={x:0,y:0,width:512,height:512}){
 if(![width,height,area.width,area.height].every(n=>Number.isFinite(n)&&n>0)||![area.x,area.y].every(Number.isFinite))throw new Error('Die Bildgröße ist ungültig.');
 const value=normalizeCrop(crop),scale=Math.max(area.width/width,area.height/height)*value.zoom,w=width*scale,h=height*scale;
 return {x:area.x+(area.width-w)/2+value.x*(w-area.width)/2,y:area.y+(area.height-h)/2+value.y*(h-area.height)/2,width:w,height:h};
}
export async function createTokenRenderer(portrait,style='concrete',extraFrame=null){
 const customFrame=customFrameFor(style,extraFrame);if(!known(style,customFrame))throw new Error('Dieser Tokenrahmen ist nicht verfügbar.');
 const source=await createImageBitmap(portrait.file);let overlay,mask;
 try{
  const pair=savedFrames()[style];let stencil=null,frame=null,area={x:0,y:0,width:512,height:512};
  if(customFrame){
   overlay=await loadBitmap(customFrame.overlay);mask=await loadBitmap(customFrame.clip);
   if(overlay.width!==customFrame.width||overlay.height!==customFrame.height||mask.width!==overlay.width||mask.height!==overlay.height)throw new Error('Der gespeicherte eigene Rahmen hat eine andere Bildgröße. Bitte erneut hinzufügen.');
   const scale=512/Math.max(overlay.width,overlay.height),w=overlay.width*scale,h=overlay.height*scale,x=(512-w)/2,y=(512-h)/2;
   frame=document.createElement('canvas');frame.width=frame.height=512;frame.getContext('2d').drawImage(overlay,x,y,w,h);
   stencil=document.createElement('canvas');stencil.width=stencil.height=512;stencil.getContext('2d').drawImage(mask,x,y,w,h);
   area={x:x+customFrame.window.x*scale,y:y+customFrame.window.y*scale,width:customFrame.window.width*scale,height:customFrame.window.height*scale};
  }
  if(pair&&!customFrame){
   overlay=await loadBitmap(pair.overlay);mask=await loadBitmap(pair.mask);
   stencil=document.createElement('canvas');stencil.width=stencil.height=512;
   const sc=stencil.getContext('2d');sc.drawImage(mask,0,0,512,512);const pixels=sc.getImageData(0,0,512,512);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.min(255,pixels.data[i]*2);sc.putImageData(pixels,0,0);
   frame=document.createElement('canvas');frame.width=frame.height=512;const fc=frame.getContext('2d');fc.drawImage(overlay,0,0,512,512);const colors=fc.getImageData(0,0,512,512);for(let i=0;i<colors.data.length;i+=4)if(colors.data[i]>colors.data[i+1]+8&&colors.data[i+2]>colors.data[i+1]+8)colors.data[i+3]=0;fc.putImageData(colors,0,0);
  }
  let closed=false;
  return {width:source.width,height:source.height,area,customFrame,hasFrame:Boolean(pair||customFrame),draw(canvas,crop=DEFAULT_CROP){
   if(closed)throw new Error('Die Bildvorschau ist bereits geschlossen.');
   canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),rect=portraitWindowGeometry(source.width,source.height,crop,area);ctx.drawImage(source,rect.x,rect.y,rect.width,rect.height);
   if(stencil){ctx.globalCompositeOperation=customFrame?'destination-in':'destination-out';ctx.drawImage(stencil,0,0);ctx.globalCompositeOperation='source-over';ctx.drawImage(frame,0,0);}
   else{ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(256,256,252,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
  },destroy(){if(closed)return;closed=true;source.close();overlay?.close();mask?.close();}};
 }catch(error){source.close();overlay?.close();mask?.close();throw error;}
}
export async function prepareTokenPortrait(portrait,style='concrete',crop=DEFAULT_CROP){
 const tokenCrop=normalizeCrop(crop),renderer=await createTokenRenderer(portrait,style,crop?.frame);
 try{const canvas=document.createElement('canvas');renderer.draw(canvas,tokenCrop);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Das runde Tokenbild konnte nicht erstellt werden.');
  return {...portrait,token:{file:new File([blob],'token.png',{type:'image/png'}),extension:'png'},tokenStyle:style,tokenCrop,...(renderer.customFrame?{tokenFrame:renderer.customFrame}:{}),hasFrame:renderer.hasFrame};
 }finally{renderer.destroy();}
}
export async function portraitFromActor(actor){
 if(!actor?.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Zum Ändern des Tokens werden Besitzerrechte benötigt.');
 const url=new URL(actor.img,location.href);if(url.origin!==location.origin)throw new Error('Bitte das Charakterbild zuerst über den Bildimport in die Welt übernehmen.');
 const response=await fetch(url);if(!response.ok)throw new Error('Das Charakterbild konnte nicht geladen werden.');
 const blob=await response.blob(),name=url.pathname.split('/').at(-1);
 return preparePortrait(new File([blob],name,{type:blob.type}));
}
export async function tokenFromActor(actor,style,crop=savedPortraitFraming(actor)??DEFAULT_CROP){
 return prepareTokenPortrait(await portraitFromActor(actor),style,crop);
}
