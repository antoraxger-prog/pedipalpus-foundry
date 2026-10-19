import { MAX_FILE_SIZE, parseCharacter } from './data.js';
import { MAX_PORTRAIT_SIZE } from './portraits.js';

export const MAX_BUNDLE_SIZE = 17 * 1024 * 1024;
export const MAX_UNPACKED_SIZE = 16 * 1024 * 1024;
const MAX_ENTRIES = 32;
const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', bmp: 'image/bmp', webp: 'image/webp' };
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const cp437 = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
const fail = message => { throw new Error(message); };
const extension = name => String(name ?? '').split('.').at(-1).toLowerCase();
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function crc32(bytes) {
  let value = 0xFFFFFFFF;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xFFFFFFFF) >>> 0;
}

function checkImage(bytes, ext) {
  const png = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const bmp = bytes.length >= 2 && bytes[0] === 66 && bytes[1] === 77;
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP';
  if (!IMAGE_TYPES[ext] || !(ext === 'png' && png || ['jpg', 'jpeg'].includes(ext) && jpeg || ext === 'bmp' && bmp || ext === 'webp' && webp)) {
    fail('Die Bilddatei enthält kein passendes PNG-, JPG-, BMP- oder WebP-Bild.');
  }
}

function decodeName(bytes, utf8) {
  if (utf8) {
    try { return decoder.decode(bytes); } catch { fail('Ein ZIP-Dateiname enthält ungültiges UTF-8.'); }
  }
  return Array.from(bytes, byte => byte < 128 ? String.fromCharCode(byte) : cp437[byte - 128]).join('');
}

function safePath(name) {
  if (!name || /[\u0000-\u001F]/.test(name) || /^[\/\\]/.test(name) || /^[A-Za-z]:/.test(name)) fail('Das ZIP enthält einen unsicheren oder absoluten Dateipfad.');
  const normalized = name.replace(/\\/g, '/'), parts = normalized.split('/');
  if (parts.some((part, i) => part === '..' || part === '.' || !part && i < parts.length - 1)) fail('Das ZIP enthält einen unsicheren Dateipfad.');
  return normalized;
}

function inspectExtra(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 4 > bytes.length) fail('Das ZIP enthält beschädigte Zusatzfelder.');
    const id = view.getUint16(offset, true), size = view.getUint16(offset + 2, true);
    if (id === 1) fail('ZIP64-Pakete werden nicht unterstützt.');
    offset += 4 + size;
    if (offset > bytes.length) fail('Das ZIP enthält beschädigte Zusatzfelder.');
  }
}

function parseDirectory(bytes) {
  if (bytes.length < 22) fail('Das ZIP ist unvollständig.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (view.getUint32(offset, true) === 0x06054B50 && offset + 22 + view.getUint16(offset + 20, true) === bytes.length) { end = offset; break; }
  }
  if (end < 0) fail('Das ZIP besitzt kein gültiges Inhaltsverzeichnis.');
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
  if (count === 0xFFFF || size === 0xFFFFFFFF || start === 0xFFFFFFFF) fail('ZIP64-Pakete werden nicht unterstützt.');
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count) fail('Mehrteilige ZIP-Pakete werden nicht unterstützt.');
  if (count > MAX_ENTRIES) fail('Das ZIP enthält zu viele Dateien oder Ordner (höchstens 32).');
  if (start + size !== end || start > bytes.length || size > bytes.length) fail('Das ZIP-Inhaltsverzeichnis ist beschädigt.');
  const entries = [], seen = new Set();
  let offset = start, unpacked = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014B50) fail('Das ZIP-Inhaltsverzeichnis ist beschädigt.');
    const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true);
    const crc = view.getUint32(offset + 16, true), compressed = view.getUint32(offset + 20, true), length = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true), extraLength = view.getUint16(offset + 30, true), commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true), mode = view.getUint32(offset + 38, true) >>> 16;
    if (compressed === 0xFFFFFFFF || length === 0xFFFFFFFF || localOffset === 0xFFFFFFFF) fail('ZIP64-Pakete werden nicht unterstützt.');
    if (view.getUint16(offset + 34, true)) fail('Mehrteilige ZIP-Pakete werden nicht unterstützt.');
    if (flags & 0x41) fail('Verschlüsselte ZIP-Dateien werden nicht unterstützt.');
    if (flags & ~0x080E || ![0, 8].includes(method)) fail('Diese ZIP-Kompressionsmethode wird nicht unterstützt.');
    if (view.getUint16(offset + 6, true) > 20) fail('Dieses ZIP-Format wird nicht unterstützt.');
    const finish = offset + 46 + nameLength + extraLength + commentLength;
    if (finish > end) fail('Das ZIP enthält beschädigte Dateieinträge.');
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    const name = safePath(decodeName(nameBytes, !!(flags & 0x0800)));
    if (seen.has(name.toLocaleLowerCase('de'))) fail('Das ZIP enthält mehrfach vorhandene Dateinamen.');
    seen.add(name.toLocaleLowerCase('de'));
    if ((mode & 0xF000) === 0xA000) fail('Verknüpfungen in ZIP-Dateien werden nicht unterstützt.');
    inspectExtra(bytes.subarray(offset + 46 + nameLength, offset + 46 + nameLength + extraLength));
    const directory = name.endsWith('/');
    if (directory && length !== 0) fail('Ein ZIP-Ordner enthält unerwartete Dateidaten.');
    unpacked += length;
    if (unpacked > MAX_UNPACKED_SIZE) fail('Das entpackte ZIP ist größer als 16 MB.');
    entries.push({ name, nameBytes, flags, method, crc, compressed, length, localOffset, directory });
    offset = finish;
  }
  if (offset !== end) fail('Das ZIP-Inhaltsverzeichnis enthält unerwartete Daten.');
  const ranges = [];
  for (const entry of entries) {
    const local = entry.localOffset;
    if (local + 30 > start || view.getUint32(local, true) !== 0x04034B50) fail('Ein lokaler ZIP-Dateikopf ist beschädigt.');
    if (view.getUint16(local + 4, true) > 20 || view.getUint16(local + 6, true) !== entry.flags || view.getUint16(local + 8, true) !== entry.method) fail('Die ZIP-Dateiköpfe widersprechen sich.');
    const nameLength = view.getUint16(local + 26, true), extraLength = view.getUint16(local + 28, true);
    const dataStart = local + 30 + nameLength + extraLength, dataEnd = dataStart + entry.compressed;
    if (dataStart > start || dataEnd > start) fail('Die ZIP-Dateigrößen sind ungültig.');
    const localName = bytes.subarray(local + 30, local + 30 + nameLength);
    if (localName.length !== entry.nameBytes.length || !localName.every((value, i) => value === entry.nameBytes[i])) fail('Die ZIP-Dateinamen widersprechen sich.');
    inspectExtra(bytes.subarray(local + 30 + nameLength, dataStart));
    const localValues = [view.getUint32(local + 14, true), view.getUint32(local + 18, true), view.getUint32(local + 22, true)];
    const expected = [entry.crc, entry.compressed, entry.length];
    if (localValues.some((value, i) => entry.flags & 8 ? value !== 0 && value !== expected[i] : value !== expected[i])) fail('Die ZIP-Dateigrößen oder Prüfsummen widersprechen sich.');
    let rangeEnd = dataEnd;
    if (entry.flags & 8) {
      let descriptor = dataEnd;
      if (descriptor + 4 <= start && view.getUint32(descriptor, true) === 0x08074B50) descriptor += 4;
      if (descriptor + 12 > start || expected.some((value, i) => view.getUint32(descriptor + 4 * i, true) !== value)) fail('Der ZIP-Datenabschluss ist beschädigt.');
      rangeEnd = descriptor + 12;
    }
    if (entry.method === 0 && entry.length !== entry.compressed) fail('Die ZIP-Dateigrößen sind ungültig.');
    entry.payload = bytes.subarray(dataStart, dataEnd);
    ranges.push({ start: local, end: rangeEnd });
  }
  ranges.sort((a, b) => a.start - b.start);
  if (ranges.length && ranges[0].start !== 0) fail('ZIP-Pakete mit zusätzlichen Startdaten werden nicht unterstützt.');
  for (let i = 1; i < ranges.length; i++) if (ranges[i].start < ranges[i - 1].end) fail('Die ZIP-Dateibereiche überschneiden sich.');
  return entries;
}

async function unpack(entry) {
  let bytes;
  if (entry.method === 0) bytes = entry.payload;
  else {
    let stream;
    try { stream = new Blob([entry.payload]).stream().pipeThrough(new DecompressionStream('deflate-raw')); }
    catch { fail('Dieser Browser unterstützt das Entpacken von Deflate-ZIP-Dateien nicht. Bitte die JSON und das Bild einzeln importieren.'); }
    const reader = stream.getReader(), chunks = [];
    let length = 0;
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        length += result.value.length;
        if (length > entry.length || length > MAX_UNPACKED_SIZE) { await reader.cancel(); fail('Die tatsächliche ZIP-Dateigröße überschreitet die angegebene Größe.'); }
        chunks.push(result.value);
      }
    } catch (error) {
      if (error?.message?.includes('ZIP-Dateigröße')) throw error;
      fail('Die komprimierten ZIP-Daten sind beschädigt.');
    } finally { reader.releaseLock(); }
    bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  }
  if (bytes.length !== entry.length || crc32(bytes) !== entry.crc) fail('Die ZIP-Datei ist beschädigt: Dateigröße oder Prüfsumme stimmt nicht.');
  return bytes;
}

export async function readCharacterFile(file,{includePortrait=true}={}) {
  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0) fail('Bitte eine Charakter-JSON oder ein Charakter-ZIP auswählen.');
  const ext = extension(file.name);
  if (ext === 'json') {
    if (file.size > MAX_FILE_SIZE) fail('Die Charakterdatei ist größer als 5 MB.');
    const json = await file.text();
    parseCharacter(json);
    return { json, portrait: null };
  }
  if (ext !== 'zip') fail('Bitte eine JSON- oder ZIP-Datei auswählen.');
  if (file.size > MAX_BUNDLE_SIZE) fail('Das Charakter-ZIP ist größer als 17 MB.');
  const entries = parseDirectory(new Uint8Array(await file.arrayBuffer()));
  const files = entries.filter(entry => !entry.directory), jsonEntries = files.filter(entry => extension(entry.name) === 'json');
  const images = files.filter(entry => IMAGE_TYPES[extension(entry.name)]);
  if (jsonEntries.length !== 1) fail('Das ZIP muss genau eine Pedipalpus-Charakterdatei (.json) enthalten.');
  if (images.length > 1) fail('Das ZIP enthält mehrere Bilder. Bitte genau ein Charakterbild einpacken.');
  if (files.length !== jsonEntries.length + images.length) fail('Das ZIP darf nur die Charakter-JSON und optional ein PNG-, JPG-, BMP- oder WebP-Bild enthalten.');
  if (jsonEntries[0].length > MAX_FILE_SIZE) fail('Die Charakterdatei im ZIP ist größer als 5 MB.');
  if (images[0] && (!images[0].length || images[0].length > MAX_PORTRAIT_SIZE)) fail('Das Charakterbild im ZIP muss zwischen 1 Byte und 10 MB groß sein.');
  let json, portrait = null;
  for (const entry of entries) {
    const bytes = await unpack(entry);
    if (entry === jsonEntries[0]) {
      try { json = decoder.decode(bytes); } catch { fail('Die Charakterdatei enthält ungültiges UTF-8.'); }
    } else if (entry === images[0]&&includePortrait) {
      const imageExt = extension(entry.name);
      checkImage(bytes, imageExt);
      portrait = new File([bytes], entry.name.split('/').at(-1), { type: IMAGE_TYPES[imageExt] });
    }
  }
  parseCharacter(json);
  return { json, portrait };
}

export async function writeCharacterBundle(json, portrait = null) {
  const snapshot=parseCharacter(json);
  const entries = [{ name: snapshot.sourceFormat==='Pedipalpus.Npc'?'npc.nsc.json':'character.json', bytes: encoder.encode(json) }];
  if (portrait) {
    if (!Number.isSafeInteger(portrait.size) || portrait.size <= 0 || portrait.size > MAX_PORTRAIT_SIZE) fail('Bitte ein Charakterbild bis 10 MB auswählen.');
    const ext = extension(portrait.name), bytes = new Uint8Array(await portrait.arrayBuffer());
    checkImage(bytes, ext);
    entries.push({ name: `portrait.${ext}`, bytes });
  }
  const localParts = [], centralParts = [];
  let position = 0, centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name), crc = crc32(entry.bytes), size = entry.bytes.length;
    const local = new Uint8Array(30 + name.length), localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034B50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0x0800, true);
    localView.setUint16(12, 33, true); localView.setUint32(14, crc, true); localView.setUint32(18, size, true); localView.setUint32(22, size, true);
    localView.setUint16(26, name.length, true); local.set(name, 30);
    const central = new Uint8Array(46 + name.length), centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014B50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(14, 33, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, size, true); centralView.setUint32(24, size, true);
    centralView.setUint16(28, name.length, true); centralView.setUint32(42, position, true); central.set(name, 46);
    localParts.push(local, entry.bytes); centralParts.push(central); position += local.length + size; centralSize += central.length;
  }
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054B50, true); endView.setUint16(8, entries.length, true); endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true); endView.setUint32(16, position, true);
  const result = new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
  if (result.size > MAX_BUNDLE_SIZE) fail('Das Charakter-ZIP ist größer als 17 MB.');
  return result;
}

export async function readFramePackage(file) {
 if(!file||file.size<=0||file.size>MAX_BUNDLE_SIZE)fail('Bitte ein Tokenrahmen-ZIP bis 17 MB auswählen.');
 const entries=parseDirectory(new Uint8Array(await file.arrayBuffer())).filter(entry=>!entry.directory);
 const expected=['concrete','silver-thin','undead'].flatMap(style=>[`${style}.png`,`${style}-mask.png`]);
 if(entries.length!==6||entries.some(entry=>!expected.includes(entry.name)))fail('Das Rahmenpaket muss Concrete, Silver Thin und Undead mit jeweils einem Rahmen und einer Maske enthalten.');
 const frames={};
 for(const entry of entries){if(entry.length>2*1024*1024)fail('Ein Tokenrahmen ist größer als 2 MB.');const bytes=await unpack(entry);checkImage(bytes,'png');const mask=entry.name.endsWith('-mask.png'),style=entry.name.replace(/(?:-mask)?\.png$/,'');frames[style]??={};frames[style][mask?'mask':'overlay']=new File([bytes],entry.name,{type:'image/png'});}
 return frames;
}
