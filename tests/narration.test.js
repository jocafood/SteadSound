import test from 'node:test';
import assert from 'node:assert/strict';
import { splitNarration } from '../frontend/main/narration-text.js';

test('long English descriptions split into bounded chunks without losing words',()=>{
 const text=Array.from({length:300},(_,i)=>`word${i}`).join(' ');
 const chunks=splitNarration(text);
 assert.ok(chunks.length>1);
 assert.ok(chunks.every(chunk=>chunk.length<=180));
 assert.equal(chunks.join(' '),text);
 assert.deepEqual(splitNarration('   '),[]);
});
