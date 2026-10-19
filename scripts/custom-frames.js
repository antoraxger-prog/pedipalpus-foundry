import {MODULE_ID} from './data.js';
import {preparePortrait,uploadPortrait} from './portraits.js';
export const TOKEN_STYLES=[['concrete','Concrete'],['silver-thin','Silver, Thin'],['undead','Undead']];
export function registerCustomFrames(){game.settings.register(MODULE_ID,'customTokenFrames',{scope:'user',config:false,type:Object,default:{}});}
const path=value=>typeof value==='string'&&/^worlds\/[a-zA-Z0-9_-]+\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/.test(value);
export function validateCustomFrame(value){
 if(!value||!/^custom-[a-f0-9]{64}$/.test(value.id??'')||!path(value.overlay)||!path(value.clip)||!value.overlay.endsWith(`${value.id.slice(7)}.png`))return null;
 const {width,height,window:area}=value;
 if(![width,height].every(n=>Number.isSafeInteger(n)&&n>=16&&n<=2048)||!area||![area.x,area.y,area.width,area.height].every(Number.isSafeInteger)||area.x<0||area.y<0||area.width<1||area.height<1||area.x+area.width>width||area.y+area.height>height)return null;
 return {id:value.id,name:String(value.name??'Eigener Rahmen').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,64)||'Eigener Rahmen',overlay:value.overlay,clip:value.clip,width,height,window:{x:area.x,y:area.y,width:area.width,height:area.height}};
}
export function savedCustomFrames(){try{return Object.fromEntries(Object.values(game.settings.get(MODULE_ID,'customTokenFrames')??{}).flatMap(value=>{const frame=validateCustomFrame(value);return frame?[[frame.id,frame]]:[];}));}catch{return {};}}
export function customFrameFor(style,extra=null){const provided=validateCustomFrame(extra);return provided?.id===style?provided:savedCustomFrames()[style]??null;}
export function tokenStyles(extra=null){const frames=savedCustomFrames(),provided=validateCustomFrame(extra);if(provided)frames[provided.id]??=provided;return [...TOKEN_STYLES,...Object.values(frames).map(frame=>[frame.id,`${frame.name} · Eigener Rahmen`])];}
// Das größte geschlossene transparente Fenster trennt das Portrait vom Außenbereich.
export function frameWindowMask(pixels,width,height){
 if(![width,height].every(n=>Number.isSafeInteger(n)&&n>=16&&n<=2048)||pixels?.length!==width*height*4)throw new Error('Rahmen bitte als Bild mit 16 bis 2048 Pixeln je Seite auswählen.');
 const count=width*height,visited=new Uint8Array(count),queue=new Int32Array(count),clear=i=>pixels[i*4+3]<=8;
 let head=0,tail=0;
 const add=i=>{if(!visited[i]&&clear(i)){visited[i]=1;queue[tail++]=i;}};
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
 const flood=()=>{while(head<tail){const i=queue[head++],x=i%width;if(x)add(i-1);if(x<width-1)add(i+1);if(i>=width)add(i-width);if(i<count-width)add(i+width);}};
 flood();let largest=new Int32Array(0);
 for(let i=0;i<count;i++)if(!visited[i]&&clear(i)){head=tail=0;add(i);flood();if(tail>largest.length)largest=queue.slice(0,tail);}
 if(largest.length<Math.max(16,count*.005))throw new Error('Der Rahmen braucht eine transparente Mitte mit vollständig geschlossenem Rand. PNG oder WebP mit Transparenz verwenden.');
 const mask=new Uint8ClampedArray(count*4);let minX=width,minY=height,maxX=0,maxY=0;
 const mark=i=>{mask[i*4+3]=255;const x=i%width,y=Math.floor(i/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);};
 for(const i of largest){mark(i);const x=i%width;if(x)mark(i-1);if(x<width-1)mark(i+1);if(i>=width)mark(i-width);if(i<count-width)mark(i+width);}
 return {pixels:mask,window:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}};
}
const png=async(canvas,name)=>{const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Der Rahmen konnte nicht gespeichert werden.');return {file:new File([blob],name,{type:'image/png'}),extension:'png'};};
export async function importCustomFrame(file){
 const prepared=await preparePortrait(file);if(!['png','webp'].includes(prepared.extension))throw new Error('Eigene Rahmen bitte als transparentes PNG oder WebP auswählen.');
 const image=await createImageBitmap(prepared.file);
 try{
  const {width,height}=image;if(width<16||height<16||width>2048||height>2048)throw new Error('Rahmen bitte als Bild mit 16 bis 2048 Pixeln je Seite auswählen.');
  const overlay=document.createElement('canvas');overlay.width=width;overlay.height=height;const ctx=overlay.getContext('2d');ctx.drawImage(image,0,0);const result=frameWindowMask(ctx.getImageData(0,0,width,height).data,width,height);
  const clip=document.createElement('canvas');clip.width=width;clip.height=height;clip.getContext('2d').putImageData(new ImageData(result.pixels,width,height),0,0);
  const overlayPng=await png(overlay,'frame.png'),clipPng=await png(clip,'clip.png'),digest=await crypto.subtle.digest('SHA-256',await overlayPng.file.arrayBuffer()),hash=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join(''),id=`custom-${hash}`;
  const current=savedCustomFrames();if(current[id])return current[id];if(Object.keys(current).length>=50)throw new Error('Es sind bereits 50 eigene Rahmen gespeichert.');
  const entry={id,name:String(file.name??'Eigener Rahmen').replace(/\.[^.]+$/,'').trim().slice(0,64)||'Eigener Rahmen',overlay:await uploadPortrait(overlayPng),clip:await uploadPortrait(clipPng),width,height,window:result.window};
  const latest=savedCustomFrames();if(!latest[id]&&Object.keys(latest).length>=50)throw new Error('Es sind bereits 50 eigene Rahmen gespeichert.');
  await game.settings.set(MODULE_ID,'customTokenFrames',{...latest,[id]:entry});return entry;
 }finally{image.close();}
}
