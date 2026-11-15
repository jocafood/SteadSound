import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleImage, imageChord } from '../audio/orchestra.js';

test('muestreo de toda la imagen incluye todas las regiones y limita el acorde', () => {
  const positions=[];
  const context={canvas:{width:120,height:80},getImageData(x,y){positions.push([x,y]);return {data:[x*2,y*3,100,255]}}};
  const samples=sampleImage(context,'test');
  assert.equal(samples.length,96);
  assert.ok(positions.some(([x,y])=>x<10&&y<10));
  assert.ok(positions.some(([x,y])=>x>110&&y>70));
  const notes=imageChord(samples);
  assert.ok(notes.length<=5);
  assert.equal(new Set(notes.map(n=>n.midi)).size,notes.length);
  assert.deepEqual(imageChord([{color:{r:0,g:0,b:0}}]),[]);
});
test('un mismo color no genera cientos de voces duplicadas', () => {
  const notes=imageChord(Array.from({length:96},()=>({color:{r:255,g:0,b:0}})));
  assert.equal(notes.length,1);
  assert.equal(notes[0].count,96);
});
