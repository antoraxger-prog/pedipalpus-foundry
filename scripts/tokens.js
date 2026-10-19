import { MODULE_ID } from './data.js';
import { preparePortrait, uploadPortrait } from './portraits.js';
import { readFramePackage } from './bundle.js';

export const TOKEN_STYLES=[['concrete','Concrete'],['silver-thin','Silver, Thin'],['undead','Undead']];
const known=style=>TOKEN_STYLES.some(([key])=>key===style);
export function registerTokenSettings(){game.settings.register(MODULE_ID,'tokenFrames',{scope:'world',config:false,type:Object,default:{}});}
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
 try{const value=actor?.getFlag(MODULE_ID,'portraitFraming');if(!value)return null;return {...normalizeCrop(value),style:known(value.style)?value.style:'concrete'};}catch{return null;}
}
export function portraitGeometry(width,height,crop=DEFAULT_CROP,size=512){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Number.isFinite(size)||size<=0)throw new Error('Die Bildgröße ist ungültig.');
 const value=normalizeCrop(crop),scale=size/Math.min(width,height)*value.zoom,w=width*scale,h=height*scale;
 return {x:(size-w)/2+value.x*(w-size)/2,y:(size-h)/2+value.y*(h-size)/2,width:w,height:h};
}
export async function createTokenRenderer(portrait,style='concrete'){
 if(!known(style))throw new Error('Dieser Tokenrahmen ist nicht verfügbar.');
 const source=await createImageBitmap(portrait.file);let overlay,mask;
 try{
  const pair=savedFrames()[style];let stencil=null,frame=null;
  if(pair){
   overlay=await loadBitmap(pair.overlay);mask=await loadBitmap(pair.mask);
   stencil=document.createElement('canvas');stencil.width=stencil.height=512;
   const sc=stencil.getContext('2d');sc.drawImage(mask,0,0,512,512);const pixels=sc.getImageData(0,0,512,512);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.min(255,pixels.data[i]*2);sc.putImageData(pixels,0,0);
   frame=document.createElement('canvas');frame.width=frame.height=512;const fc=frame.getContext('2d');fc.drawImage(overlay,0,0,512,512);const colors=fc.getImageData(0,0,512,512);for(let i=0;i<colors.data.length;i+=4)if(colors.data[i]>colors.data[i+1]+8&&colors.data[i+2]>colors.data[i+1]+8)colors.data[i+3]=0;fc.putImageData(colors,0,0);
  }
  let closed=false;
  return {width:source.width,height:source.height,hasFrame:Boolean(pair),draw(canvas,crop=DEFAULT_CROP){
   if(closed)throw new Error('Die Bildvorschau ist bereits geschlossen.');
   canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),rect=portraitGeometry(source.width,source.height,crop);ctx.drawImage(source,rect.x,rect.y,rect.width,rect.height);
   if(stencil){ctx.globalCompositeOperation='destination-out';ctx.drawImage(stencil,0,0);ctx.globalCompositeOperation='source-over';ctx.drawImage(frame,0,0);}
   else{ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(256,256,252,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
  },destroy(){if(closed)return;closed=true;source.close();overlay?.close();mask?.close();}};
 }catch(error){source.close();overlay?.close();mask?.close();throw error;}
}
export async function prepareTokenPortrait(portrait,style='concrete',crop=DEFAULT_CROP){
 const tokenCrop=normalizeCrop(crop),renderer=await createTokenRenderer(portrait,style);
 try{const canvas=document.createElement('canvas');renderer.draw(canvas,tokenCrop);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Das runde Tokenbild konnte nicht erstellt werden.');
  return {...portrait,token:{file:new File([blob],'token.png',{type:'image/png'}),extension:'png'},tokenStyle:style,tokenCrop,hasFrame:renderer.hasFrame};
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
