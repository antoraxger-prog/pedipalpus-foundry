const rootOf=element=>element?.querySelector('.pp-root');
const identity=root=>JSON.stringify([root.dataset.actorId??'',root.dataset.mode??'',root.querySelector('[name="category"]')?.value??'',root.querySelector('[name="search"]')?.value??'']);
function controlKey(control){
 if(control.name)return JSON.stringify(['field',control.tagName,control.name]);
 if(!control.dataset.action)return null;
 const row=control.closest('.pp-check-row'),quick=control.closest('.pp-quick-check'),host=row??quick;
 const scope=row?'row':quick?'quick':'other',variant=['pp-check-name','pp-rating','pp-dice-button'].find(name=>control.classList.contains(name))??'';
 const label=host?.querySelector('.pp-check-name')?.textContent.trim()??control.getAttribute('aria-label')??control.textContent.trim();
 return JSON.stringify(['action',control.dataset.action,control.dataset.check??'',control.dataset.blind??'',scope,variant,label]);
}
export function captureViewState(element){
 const root=rootOf(element);if(!root)return null;
 const active=element.ownerDocument.activeElement,own=active&&root.contains(active),list=root.querySelector('.pp-check-list');
 return {identity:identity(root),scrollTop:list?.scrollTop??0,scrollLeft:list?.scrollLeft??0,quickbar:root.querySelector('.pp-quickbar')?.open,
  focus:own?controlKey(active):null,...(own&&typeof active.selectionStart==='number'?{selection:[active.selectionStart,active.selectionEnd,active.selectionDirection]}:{})};
}
export function restoreViewState(element,state,{focusOnly=false}={}){
 const root=rootOf(element);if(!root||!state||identity(root)!==state.identity)return;
 const quickbar=root.querySelector('.pp-quickbar');if(!focusOnly&&quickbar&&state.quickbar!==undefined)quickbar.open=state.quickbar;
 const document=element.ownerDocument,active=document.activeElement;
 if(state.focus&&(!active||active===document.body||active===document.documentElement||element.contains(active)&&controlKey(active)===state.focus)){
  const candidates=Array.from(root.querySelectorAll('[name], [data-action]')).filter(control=>controlKey(control)===state.focus);
  const matches=candidates.filter(control=>!control.disabled&&control.getClientRects().length);
  const target=matches.length===1?matches[0]:candidates.some(control=>control.disabled)?null:root.querySelector('[name="search"]');
  if(target&&!target.disabled&&target.getClientRects().length){
   target.focus({preventScroll:true});
   if(matches.length===1&&state.selection&&typeof target.selectionStart==='number')target.setSelectionRange(...state.selection);
  }
 }
 const list=root.querySelector('.pp-check-list');if(!focusOnly&&list){list.scrollTop=state.scrollTop;list.scrollLeft=state.scrollLeft;}
}
