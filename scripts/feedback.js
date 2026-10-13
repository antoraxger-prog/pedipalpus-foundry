const EVENTS = new Set(['dial', 'roll', 'focus', 'import', 'favorite', 'error', 'preview']);
const STATES = new Set(['pending', 'success', 'error', 'focus-changed', 'modifier-consumed', 'saved', 'favorite']);
const notices = new WeakMap();
let audioContext;
let lastDial = -Infinity;

function stateFor(event) {
  const value = String(event).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[:\s]+/g, '-');
  const aliases = { 'roll-pending': 'pending', 'roll-success': 'success', 'roll-error': 'error', focus: 'focus-changed', import: 'saved', roll: 'success' };
  const state = aliases[value] || value;
  return STATES.has(state) ? state : null;
}

export function notifyFeedback(element, event, text, { animations = 'subtle', theme = 'fantasy' } = {}) {
  if (!element?.querySelector || !element.ownerDocument) return null;
  const previous = notices.get(element);
  if (previous) clearTimeout(previous);
  let status = element.classList.contains('pp-feedback') ? element : element.querySelector('.pp-feedback');
  if (!status) {
    status = element.ownerDocument.createElement('div');
    status.className = 'pp-feedback';
    element.append(status);
  }
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  status.textContent = String(text ?? '');
  element.dataset.ppAnimations = ['off', 'subtle', 'lively'].includes(animations) ? animations : 'subtle';
  element.dataset.ppFeedbackTheme = theme === 'ork' ? 'ork' : 'fantasy';
  for (const state of STATES) element.classList.remove(`pp-feedback-${state}`);
  const state = stateFor(event);
  if (state) {
    element.classList.add(`pp-feedback-${state}`);
    if (state !== 'pending') {
      notices.set(element, setTimeout(() => {
        element.classList.remove(`pp-feedback-${state}`);
        notices.delete(element);
      }, 600));
    }
  }
  return status;
}

function tone(context, output, start, frequency, duration, level, type = 'sine', endFrequency = frequency) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + .002);
  envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + .01);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
}

function click(context, output, start, duration = .012, level = .5) {
  const buffer = context.createBuffer(1, Math.max(1, Math.round(context.sampleRate * duration)), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3);
  }
  const source = context.createBufferSource();
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(level, start);
  source.buffer = buffer;
  source.connect(envelope);
  envelope.connect(output);
  source.start(start);
  source.onended = () => { source.disconnect(); envelope.disconnect(); };
}

export async function playFeedback(event, { sound = false, volume = .25, soundSet = 'theme', theme = 'fantasy' } = {}) {
  const numericVolume = Number(volume);
  if (!sound || !Number.isFinite(numericVolume) || numericVolume <= 0 || !EVENTS.has(event)) return false;
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext) return false;
  try {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContext();
      lastDial = -Infinity;
    }
    const context = audioContext;
    if (context.state === 'suspended') await context.resume();
    if (context.state !== 'running') return false;
    const start = context.currentTime;
    if ((event === 'dial' || event === 'preview') && start - lastDial < 1 / 12) return false;
    if (event === 'dial' || event === 'preview') lastDial = start;
    const output = context.createGain();
    output.gain.setValueAtTime(Math.min(numericVolume, 1) * .16, start);
    output.connect(context.destination);
    const ork = soundSet === 'ork' || (soundSet === 'theme' && theme === 'ork');
    if (event === 'dial' || event === 'preview') {
      click(context, output, start, .009, .75);
      tone(context, output, start, 1700, .035, .6, 'sine', 1300);
      tone(context, output, start, 2860, .045, .25);
      tone(context, output, start + .008, 940, .045, .2);
    } else if (event === 'error') {
      tone(context, output, start, ork ? 130 : 230, .12, .5, 'triangle', ork ? 90 : 170);
    } else if (event === 'roll') {
      click(context, output, start, .018, .4);
      tone(context, output, start, ork ? 170 : 340, .08, .5, 'triangle', ork ? 105 : 200);
      tone(context, output, start + .03, ork ? 380 : 860, .06, .2);
    } else if (event === 'focus') {
      click(context, output, start, .013, .25);
      tone(context, output, start, ork ? 220 : 520, .06, .35, 'triangle');
    } else if (event === 'favorite') {
      tone(context, output, start, ork ? 320 : 960, .08, .45);
      tone(context, output, start + .02, ork ? 510 : 1440, .07, .2);
    } else if (event === 'import') {
      click(context, output, start, .06, .22);
      tone(context, output, start, ork ? 140 : 440, .12, .25, 'triangle');
    }
    setTimeout(() => output.disconnect(), 400);
    return true;
  } catch {
    return false;
  }
}
