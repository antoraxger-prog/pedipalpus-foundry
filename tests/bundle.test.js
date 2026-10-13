import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { fixture } from './fixture.js';
import { readCharacterFile, writeCharacterBundle, crc32, MAX_BUNDLE_SIZE } from '../scripts/bundle.js';

const json = JSON.stringify(fixture());
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const encoder = new TextEncoder();

function zip(files) {
  const localParts = [], centralParts = [];
  let position = 0, centralSize = 0;
  for (const entry of files) {
    const bytes = typeof entry.content === 'string' ? encoder.encode(entry.content) : entry.content ?? new Uint8Array();
    const compressed = entry.deflate ? deflateRawSync(bytes) : bytes, name = encoder.encode(entry.name);
    const flags = 0x0800 | (entry.descriptor ? 8 : 0), method = entry.deflate ? 8 : 0;
    const size = entry.declaredSize ?? bytes.length, crc = crc32(bytes);
    const local = new Uint8Array(30 + name.length), localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034B50, true); localView.setUint16(4, 20, true); localView.setUint16(6, flags, true); localView.setUint16(8, method, true);
    if (!entry.descriptor) { localView.setUint32(14, crc, true); localView.setUint32(18, compressed.length, true); localView.setUint32(22, size, true); }
    localView.setUint16(26, name.length, true); local.set(name, 30);
    const central = new Uint8Array(46 + name.length), centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014B50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, flags, true);
    centralView.setUint16(10, method, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, compressed.length, true); centralView.setUint32(24, size, true);
    centralView.setUint16(28, name.length, true); centralView.setUint32(42, position, true); central.set(name, 46);
    const descriptor = new Uint8Array(entry.descriptor ? 16 : 0);
    if (entry.descriptor) { const dv = new DataView(descriptor.buffer); dv.setUint32(0, 0x08074B50, true); dv.setUint32(4, crc, true); dv.setUint32(8, compressed.length, true); dv.setUint32(12, size, true); }
    localParts.push(local, compressed, descriptor); centralParts.push(central); position += local.length + compressed.length + descriptor.length; centralSize += central.length;
  }
  const end = new Uint8Array(22), dv = new DataView(end.buffer);
  dv.setUint32(0, 0x06054B50, true); dv.setUint16(8, files.length, true); dv.setUint16(10, files.length, true); dv.setUint32(12, centralSize, true); dv.setUint32(16, position, true);
  return new File([...localParts, ...centralParts, end], 'bundle.zip', { type: 'application/zip' });
}

test('Character bundles round-trip original JSON and optional image without reconstructing data', async () => {
  const original = JSON.stringify({ ...fixture(), ExtraUnrecognizedData: { value: 'Erhalten' } }, null, 2);
  const image = new File([png], 'Mein Gesicht.PNG', { type: 'image/png' });
  const blob = await writeCharacterBundle(original, image);
  assert.equal(blob.type, 'application/zip');
  const result = await readCharacterFile(new File([blob], 'Charakter.zip'));
  assert.equal(result.json, original);
  assert.equal(result.portrait.name, 'portrait.png');
  assert.equal(result.portrait.type, 'image/png');
  assert.deepEqual(new Uint8Array(await result.portrait.arrayBuffer()), png);
  const withoutImage = await readCharacterFile(new File([await writeCharacterBundle(original)], 'Charakter.zip'));
  assert.equal(withoutImage.portrait, null);
  assert.equal(withoutImage.json, original);
  const withBom = '\uFEFF' + original;
  assert.equal((await readCharacterFile(new File([await writeCharacterBundle(withBom)], 'bom.zip'))).json, withBom);
});

test('Normal JSON and arbitrary ZIP filenames and directory paths are supported', async () => {
  assert.deepEqual(await readCharacterFile(new File([json], 'Anderer Name.json')), { json, portrait: null });
  const result = await readCharacterFile(zip([{ name: 'Charakter/' }, { name: 'Charakter/Dämmerfels.json', content: json }, { name: 'Bilder/Gesicht.png', content: png }]));
  assert.equal(result.json, json);
  assert.equal(result.portrait.name, 'Gesicht.png');
  assert.equal(result.portrait.type, 'image/png');
});

test('Deflate streams and signed data descriptors are supported and checked', async () => {
  const result = await readCharacterFile(zip([{ name: 'Saved.json', content: json, deflate: true, descriptor: true }, { name: 'Face.png', content: png, deflate: true }]));
  assert.equal(result.json, json);
  assert.deepEqual(new Uint8Array(await result.portrait.arrayBuffer()), png);
  const data = new Uint8Array(await zip([{ name: 'Saved.json', content: json, deflate: true, descriptor: true }]).arrayBuffer());
  const view = new DataView(data.buffer), descriptor = 30 + encoder.encode('Saved.json').length + deflateRawSync(encoder.encode(json)).length;
  view.setUint32(descriptor + 4, 123, true);
  await assert.rejects(readCharacterFile(new File([data], 'bad.zip')), /Datenabschluss/);
});

test('Ambiguous JSONs, multiple images and unrelated files are rejected', async () => {
  await assert.rejects(readCharacterFile(zip([{ name: 'one.json', content: json }, { name: 'two.json', content: json }])), /genau eine/);
  await assert.rejects(readCharacterFile(zip([{ name: 'only.png', content: png }])), /genau eine/);
  await assert.rejects(readCharacterFile(zip([{ name: 'one.json', content: json }, { name: 'one.png', content: png }, { name: 'two.png', content: png }])), /mehrere Bilder/);
  await assert.rejects(readCharacterFile(zip([{ name: 'one.json', content: json }, { name: 'program.exe', content: 'Ignored?' }])), /nur die Charakter/);
  await assert.rejects(readCharacterFile(zip([{ name: 'one.json', content: json }, { name: 'one.json', content: json }])), /mehrfach/);
});

test('Unsafe ZIP paths are rejected before any content is used', async () => {
  for (const name of ['../character.json', 'nested/../../character.json', '/character.json', 'C:/character.json', '\\\\server\\character.json', 'nested\\..\\character.json', 'a/./character.json', 'bad\0.json']) {
    await assert.rejects(readCharacterFile(zip([{ name, content: json }])), /unsicher|absolut/);
  }
});

test('Corrupted data, contradictory headers and unsupported ZIP features are rejected', async () => {
  const original = new Uint8Array(await zip([{ name: 'saved.json', content: json }]).arrayBuffer());
  const changed = original.slice(); changed[30 + encoder.encode('saved.json').length + 5] ^= 1;
  await assert.rejects(readCharacterFile(new File([changed], 'bad.zip')), /Prüfsumme/);
  const conflicting = original.slice(), dv = new DataView(conflicting.buffer); dv.setUint32(22, 1, true);
  await assert.rejects(readCharacterFile(new File([conflicting], 'bad.zip')), /widersprechen/);
  const central = 30 + encoder.encode('saved.json').length + encoder.encode(json).length;
  for (const [field, value, message] of [[8, 0x801, /Verschlüssel/], [10, 99, /Kompressionsmethode/]]) {
    const data = original.slice(), view = new DataView(data.buffer); view.setUint16(central + field, value, true);
    await assert.rejects(readCharacterFile(new File([data], 'bad.zip')), message);
  }
  const zip64 = original.slice(); new DataView(zip64.buffer).setUint32(central + 24, 0xFFFFFFFF, true);
  await assert.rejects(readCharacterFile(new File([zip64], 'bad.zip')), /ZIP64/);
  const symlink = original.slice(); new DataView(symlink.buffer).setUint32(central + 38, 0xA0000000, true);
  await assert.rejects(readCharacterFile(new File([symlink], 'bad.zip')), /Verknüpfungen/);
  await assert.rejects(readCharacterFile(new File([original.subarray(0, original.length - 1)], 'bad.zip')), /Inhaltsverzeichnis/);
});

test('Size bounds and unexpected expansion prevent oversized archive input', async () => {
  await assert.rejects(readCharacterFile({ name: 'big.zip', size: MAX_BUNDLE_SIZE + 1 }), /17 MB/);
  await assert.rejects(readCharacterFile({ name: 'big.json', size: 5 * 1024 * 1024 + 1 }), /5 MB/);
  await assert.rejects(readCharacterFile(zip([{ name: 'big.json', content: json, deflate: true, declaredSize: 17 * 1024 * 1024 }])), /16 MB/);
  await assert.rejects(readCharacterFile(zip([{ name: 'big.json', content: json, deflate: true, declaredSize: 5 * 1024 * 1024 + 1 }])), /5 MB/);
  await assert.rejects(readCharacterFile(zip([{ name: 'saved.json', content: json }, { name: 'big.png', content: png, deflate: true, declaredSize: 10 * 1024 * 1024 + 1 }])), /10 MB/);
  await assert.rejects(readCharacterFile(zip([{ name: 'saved.json', content: json, deflate: true, declaredSize: 1 }])), /tatsächliche ZIP-Dateigröße/);
  await assert.rejects(readCharacterFile(zip(Array.from({ length: 33 }, (_, i) => ({ name: `directory-${i}/` })))), /zu viele/);
});

test('Saved JSON and image extension signatures are validated for import and export', async () => {
  await assert.rejects(readCharacterFile(new File(['{}'], 'bad.json')), /vollständige/);
  await assert.rejects(writeCharacterBundle('{}'), /vollständige/);
  await assert.rejects(writeCharacterBundle(json, new File(['text'], 'portrait.png')), /passendes/);
  await assert.rejects(writeCharacterBundle(json, new File([png], 'portrait.jpg')), /passendes/);
  await assert.rejects(readCharacterFile(zip([{ name: 'saved.json', content: json }, { name: 'bad.png', content: 'wrong signature' }])), /passendes/);
  assert.equal(crc32(encoder.encode('123456789')), 0xCBF43926);
});
