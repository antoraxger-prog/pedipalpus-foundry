const fold=value=>String(value??'').toLocaleLowerCase('de').normalize('NFKD').replace(/\p{M}/gu,'').replace(/ß/g,'ss').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u');

export function searchTerms(value){return fold(value).trim().split(/\s+/u).filter(Boolean);}
export function matchesSearch(value,terms){const text=fold(value);return terms.every(term=>text.includes(term));}

export function visibleRollButtons(root){
 return Array.from(root.querySelectorAll('.pp-check-row .pp-dice-button[data-blind="false"], .pp-companion-quick [data-action="roll"]')).filter(button=>{
  if(button.disabled||!button.getClientRects().length)return false;
  const quick=button.closest('.pp-companion-quick');return !quick||!button.closest('[data-companion-section]')?.open;
 });
}

export function handleProbeKeys(event,root,{busy=false}={}){
 if(busy||event.isComposing)return;
 const search=root.querySelector('[name="search"]');if(!search)return;
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='f'){
  event.preventDefault();search.focus();search.select();return;
 }
 if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
 const inSearch=event.target===search,button=event.target.closest?.('[data-action="roll"]');
 if(!inSearch&&!button)return;
 if(event.key==='Escape'&&!inSearch){event.preventDefault();search.focus();search.select();return;}
 if(!inSearch&&['Home','End'].includes(event.key)){
  event.preventDefault();const choices=visibleRollButtons(root),target=event.key==='Home'?choices[0]:choices.at(-1);target?.focus();target?.scrollIntoView?.({block:'nearest'});return;
 }
 if(!['ArrowDown','ArrowUp'].includes(event.key))return;
 event.preventDefault();
 const choices=visibleRollButtons(root);
 if(inSearch){if(event.key==='ArrowDown')choices[0]?.focus();return;}
 const row=button.closest('.pp-check-row'),index=choices.findIndex(choice=>choice===button||(row?choice.closest('.pp-check-row')===row:choice.dataset.check===button.dataset.check));
 if(index<0)return;
 const target=event.key==='ArrowDown'?choices[Math.min(index+1,choices.length-1)]:index===0?search:choices[index-1];
 target?.focus();target?.scrollIntoView?.({block:'nearest'});
}
