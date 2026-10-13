import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { playFeedback, notifyFeedback, prepareFeedback } from '../scripts/feedback.js';

function audioRuntime() {
  const contexts = [];
  contexts.fetches=[];
  globalThis.fetch=async url=>{contexts.fetches.push(url);const bytes=fs.readFileSync(new URL(url));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  class Node {
    constructor() {
      this.connections = [];
      this.frequency = { setValueAtTime: value => { this.hz = value; }, exponentialRampToValueAtTime() {} };
      this.gain = { setValueAtTime: value => { this.level = value; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
    }
    connect(target) { this.connections.push(target); }
    disconnect() {}
    start() {}
    stop() {}
  }
  globalThis.AudioContext = class {
    constructor() { this.state = 'running'; this.currentTime = 1; this.sampleRate = 48000; this.destination = {}; this.nodes = []; contexts.push(this); }
    createGain() { const node = new Node(); this.nodes.push(node); return node; }
    createOscillator() { const node = new Node(); this.nodes.push(node); return node; }
    createBufferSource() { const node = new Node(); this.nodes.push(node); return node; }
    createBuffer(channels, length) { assert.equal(channels, 1); return { getChannelData: () => new Float32Array(length) }; }
    async decodeAudioData(bytes) { return {duration:(bytes.byteLength-44)/96000,size:bytes.byteLength}; }
    async resume() { this.state = 'running'; }
  };
  globalThis.game = { socket: { emit() { throw new Error('Sound must stay local'); } } };
  return contexts;
}

function element() {
  const classes = new Set();
  const root = {
    classList: { contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name) },
    dataset: {}, children: [], attributes: {},
    querySelector() { return this.children.find(child => child.className === 'pp-feedback') || null; },
    append(child) { this.children.push(child); },
    setAttribute(name, value) { this.attributes[name] = value; },
    ownerDocument: { createElement: () => ({ className: '', textContent: '', attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }) }
  };
  return root;
}

test('Disabled sound and zero volume do not allocate audio resources', async () => {
  const contexts = audioRuntime();
  assert.equal(await playFeedback('dial'), false);
  assert.equal(await playFeedback('dial', { sound: true, volume: 0 }), false);
  assert.equal(await playFeedback('dial', { sound: true, volume: NaN }), false);
  assert.equal(await playFeedback('unknown', { sound: true }), false);
  assert.equal(contexts.length, 0);
});

test('Metallic dial feedback is local, quiet and rate limited without limiting input values', async () => {
  const contexts = audioRuntime();
  assert.equal(await playFeedback('dial', { sound: true, volume: 50, theme: 'ork' }), true);
  const context = contexts[0];
  assert.equal(context.nodes[0].level, .28);
  assert.deepEqual(context.nodes[0].connections, [context.destination]);
  assert.equal(contexts.fetches.length,3);
  assert.ok(context.nodes.some(node=>node.buffer?.duration>0 && node.buffer.duration<.1),'Short source sample is used');
  const before = context.nodes.length;
  for (let i = 0; i < 20; i++) assert.equal(await playFeedback('dial', { sound: true }), false);
  assert.equal(context.nodes.length, before);
  context.currentTime += .09;
  assert.equal(await playFeedback('dial', { sound: true }), true);
  context.state = 'closed';
});

test('All three real click samples are selected randomly, cached and primed without sound', async () => {
  const contexts=audioRuntime(),random=Math.random;
  try {
    assert.equal(await prepareFeedback({sound:false}),false);
    assert.equal(contexts.fetches.length,0);
    assert.equal(await prepareFeedback({sound:true}),true);
    const context=contexts[0];
    assert.equal(context.nodes.length,0);
    for(const value of [.05,.5,.95]){
      Math.random=()=>value;context.currentTime+=.1;
      assert.equal(await playFeedback('dial',{sound:true,volume:.25}),true);
    }
    const sizes=new Set(context.nodes.filter(node=>node.buffer).map(node=>node.buffer.size));
    assert.equal(sizes.size,3);
    assert.equal(contexts.fetches.length,3);
    for(const url of contexts.fetches){
      const bytes=fs.readFileSync(new URL(url));
      assert.equal(bytes.toString('ascii',0,4),'RIFF');
      assert.equal(bytes.toString('ascii',8,12),'WAVE');
      assert.equal(bytes.readUInt16LE(22),1);
      assert.equal(bytes.readUInt32LE(24),48000);
    }
    context.state='closed';
  }finally{Math.random=random;}
});

test('Theme sounds differ while errors remain gentle and playback failure cannot interrupt an action', async () => {
  const contexts = audioRuntime();
  assert.equal(await playFeedback('roll', { sound: true, theme: 'fantasy' }), true);
  assert.ok(contexts[0].nodes.some(node => node.hz === 340));
  contexts[0].state = 'closed';
  assert.equal(await playFeedback('roll', { sound: true, theme: 'ork' }), true);
  assert.ok(contexts[1].nodes.some(node => node.hz === 170));
  contexts[1].state = 'closed';
  globalThis.AudioContext = class { constructor() { throw new Error('Blocked audio'); } };
  assert.equal(await playFeedback('error', { sound: true }), false);
});

test('Feedback presents safe text and replaces pending state without announcing a roll result', () => {
  const root = element();
  const notice = notifyFeedback(root, 'rollPending', '<img src=x>', { animations: 'off', theme: 'ork' });
  assert.equal(notice.textContent, '<img src=x>');
  assert.equal(notice.attributes.role, 'status');
  assert.equal(notice.attributes['aria-live'], 'polite');
  assert.equal(root.dataset.ppAnimations, 'off');
  assert.equal(root.classList.contains('pp-feedback-pending'), true);
  notifyFeedback(root, 'rollError', 'Probe konnte nicht ausgelöst werden.');
  assert.equal(root.classList.contains('pp-feedback-pending'), false);
  assert.equal(root.classList.contains('pp-feedback-error'), true);
  assert.equal(root.children.length, 1);
  assert.equal(notice.textContent, 'Probe konnte nicht ausgelöst werden.');
});

test('Focus, modifier, saved and favorite events are explicit rather than render effects', () => {
  const root = element();
  for (const [event, state] of [['focusChanged', 'focus-changed'], ['modifierConsumed', 'modifier-consumed'], ['saved', 'saved'], ['favorite', 'favorite']]) {
    notifyFeedback(root, event, event, { animations: 'lively' });
    assert.equal(root.classList.contains(`pp-feedback-${state}`), true);
    assert.equal(root.dataset.ppAnimations, 'lively');
  }
  notifyFeedback(root, 'unknown', 'Information', { animations: 'invalid' });
  assert.equal(root.classList.contains('pp-feedback-favorite'), false);
  assert.equal(root.dataset.ppAnimations, 'subtle');
});
