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

export async function prepareTokenPortrait(portrait,style='concrete'){
 if(!known(style))throw new Error('Dieser Tokenrahmen ist nicht verfügbar.');
 const source=await createImageBitmap(portrait.file);let overlay,mask;
 try{
  const pair=savedFrames()[style];
  if(pair){overlay=await loadBitmap(pair.overlay);mask=await loadBitmap(pair.mask);}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d'),scale=512/Math.min(source.width,source.height);
  ctx.drawImage(source,(512-source.width*scale)/2,(512-source.height*scale)/2,source.width*scale,source.height*scale);
  if(mask){const stencil=document.createElement('canvas');stencil.width=stencil.height=512;const sc=stencil.getContext('2d');sc.drawImage(mask,0,0,512,512);const pixels=sc.getImageData(0,0,512,512);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=Math.min(255,pixels.data[i]*2);sc.putImageData(pixels,0,0);ctx.globalCompositeOperation='destination-out';ctx.drawImage(stencil,0,0);ctx.globalCompositeOperation='source-over';sc.clearRect(0,0,512,512);sc.drawImage(overlay,0,0,512,512);const framePixels=sc.getImageData(0,0,512,512);for(let i=0;i<framePixels.data.length;i+=4)if(framePixels.data[i]>framePixels.data[i+1]+8&&framePixels.data[i+2]>framePixels.data[i+1]+8)framePixels.data[i+3]=0;sc.putImageData(framePixels,0,0);ctx.drawImage(stencil,0,0);}
  else{ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(256,256,252,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Das runde Tokenbild konnte nicht erstellt werden.');
  return {...portrait,token:{file:new File([blob],'token.png',{type:'image/png'}),extension:'png'},tokenStyle:style,hasFrame:Boolean(pair)};
 }finally{source.close();overlay?.close();mask?.close();}
}

export async function tokenFromActor(actor,style){
 if(!actor?.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Zum Ändern des Tokens werden Besitzerrechte benötigt.');
 const url=new URL(actor.img,location.href);if(url.origin!==location.origin)throw new Error('Bitte das Charakterbild zuerst über den Bildimport in die Welt übernehmen.');
 const response=await fetch(url);if(!response.ok)throw new Error('Das Charakterbild konnte nicht geladen werden.');
 const blob=await response.blob(),name=url.pathname.split('/').at(-1);
 return prepareTokenPortrait(await preparePortrait(new File([blob],name,{type:blob.type})),style);
}
