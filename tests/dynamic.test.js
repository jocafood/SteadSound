import test from 'node:test';
import assert from 'node:assert/strict';
import { pixelToDynamic, imageRhythm, shouldPlayDynamic } from '../audio/dynamic-mapping.js';

test('colores primarios y secundarios tienen familias sonoras distintas', () => {
  const colors=[{r:255,g:0,b:0},{r:255,g:255,b:0},{r:0,g:255,b:0},{r:0,g:255,b:255},{r:0,g:0,b:255},{r:255,g:0,b:255}];
  assert.equal(new Set(colors.map(c=>pixelToDynamic(c).family)).size,6);
  assert.equal(pixelToDynamic({r:128,g:128,b:128}).family,'neutral');
});
test('negro es silencio y los grises oscuros pierden volumen progresivamente', () => {
  const gray=v=>pixelToDynamic({r:v,g:v,b:v});
  assert.equal(gray(0).silent,true);
  assert.equal(gray(10).silent,true);
  assert.ok(gray(25).velocity < gray(100).velocity);
  assert.ok(gray(100).velocity < gray(255).velocity);
  assert.ok(gray(25).velocity<0.02);
});
test('BPM instrumental aumenta con luminosidad global, incluyendo fondos negros', () => {
  const scene=(r,g=r,b=r)=>[{color:{r,g,b}}];
  const black=imageRhythm(scene(0)),dark=imageRhythm(scene(40)),gray=imageRhythm(scene(128)),white=imageRhythm(scene(255));
  assert.equal(black.bpm,48);
  assert.ok(white.noteInterval < dark.noteInterval);
  assert.ok(black.bpm<dark.bpm && dark.bpm<gray.bpm && gray.bpm<white.bpm);
  assert.ok(imageRhythm(scene(0,255,0)).bpm>gray.bpm);
  assert.ok(imageRhythm([...scene(255),...scene(0)]).bpm<white.bpm);
  for(const info of [black,dark,gray,white,imageRhythm([])])assert.ok(info.bpm>=48&&info.bpm<=144);
});
test('se reproduce un nuevo timbre aunque el tono musical sea igual', () => {
  const note=pixelToDynamic({r:255,g:0,b:0});
  assert.equal(shouldPlayDynamic(note,{midi:note.midi,family:'blue',time:1},1.3),true);
  assert.equal(shouldPlayDynamic(note,{midi:note.midi,family:note.family,time:1},1.3),false);
});
