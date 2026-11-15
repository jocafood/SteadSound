import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScan } from '../audio/scanner.js';

test('escáner analiza todos los píxeles, en bandas de arriba a abajo', () => {
  const visits=[];
  const context={canvas:{width:4,height:5},getImageData(x,y,w,h){
    for(let row=y;row<y+h;row++)for(let col=0;col<w;col++)visits.push(`${col}:${row}`);
    return {data:Uint8ClampedArray.from(Array.from({length:w*h},()=>y<2?[255,0,0,255]:[0,0,255,255]).flat())};
  }};
  const scan=buildScan(context,2);
  assert.equal(visits.length,20);assert.equal(new Set(visits).size,20);
  assert.deepEqual(scan.rows.map(r=>[r.yStart,r.yEnd]),[[0,2],[2,5]]);
  assert.equal(scan.rows[0].notes[0].family,'red');
  assert.equal(scan.rows[1].notes[0].family,'blue');
  assert.equal(scan.rows[0].notes[0].count,8);
  assert.equal(scan.rows[1].notes[0].count,12);
});
test('filas negras conservan su lugar como silencio',()=>{
  const scan=buildScan({canvas:{width:1,height:2},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}}});
  assert.equal(scan.rows.length,2);assert.ok(scan.rows.every(r=>!r.notes.length));
});
