import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchTerms,matchesSearch} from '../scripts/search.js';

test('German search accepts umlauts, their keyboard replacements, sharp s and decomposed accents',()=>{
 for(const query of ['Körperkraft','Koerperkraft','korperkraft','KOERPERKRAFT','Ko\u0308rperkraft'])assert.equal(matchesSearch('Körperkraft',searchTerms(query)),true,query);
 for(const query of ['Straße','Strasse','STRASSE'])assert.equal(matchesSearch('Straße',searchTerms(query)),true,query);
 assert.equal(matchesSearch('Überreden',searchTerms('uberreden')),true);assert.equal(matchesSearch('Götterkunde',searchTerms('goetterkunde')),true);
});

test('All search words must match in any order across skill, talent and companion context',()=>{
 assert.equal(matchesSearch('Geographie Derekunde',searchTerms('Derekunde Geographie')),true);
 assert.equal(matchesSearch('Skelett – Hieb Skelett Träger',searchTerms('traeger hieb')),true);
 assert.equal(matchesSearch('Skelett – Mut Skelett Träger',searchTerms('traeger hieb')),false);
 assert.equal(matchesSearch('Geographie Derekunde',searchTerms('Geographie Geschichte')),false);
 assert.deepEqual(searchTerms('  Skelett\u00a0 \tHieb\n'),['skelett','hieb']);
});

test('Blank searches match all while punctuation and markup remain ordinary search text',()=>{
 assert.equal(matchesSearch('Geographie',searchTerms(' \n\t ')),true);assert.equal(matchesSearch(undefined,searchTerms('')),true);
 assert.equal(matchesSearch('Geographie',searchTerms('<script>')),false);assert.equal(matchesSearch('Hieb (Schild)',searchTerms('(schild)')),true);
});
