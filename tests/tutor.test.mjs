import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../js/tutor.js',import.meta.url),'utf8'),context);
const tutor=vm.runInContext('MathTutor',context);
test('arithmetic follows mathematical precedence including unary minus and right-associative powers',()=>{
  for(const [input,expected] of [['2+3*4','14'],['(2+3)*4','20'],['-2^2','-4'],['2^-2','0.25'],['2^3^2','512'],['sqrt(81)+2','11'],['50% * 80','40'],['What is 3 × (4 − 1)?','9'],['1/2+1/3','5/6']]) assert.equal(tutor.solve(input).answer,expected,input);
  assert.equal(tutor.solve('2*pi').answer,'6.283185307');
});
test('equations expand parentheses, collect both sides and distinguish identity from contradiction',()=>{
  for(const [input,expected] of [['2(x+3)=18','x = 6'],['2x+3=x+9','x = 6'],['x=x','Every real x is a solution'],['x+1=x','No solution'],['x^2-5x+6=0','x = 3 or x = 2'],['x^2+1=0','No real solutions']]) assert.equal(tutor.solve(input).answer,expected,input);
  assert.match(tutor.solve('2(x+3)=18').check,/left side 18, right side 18/);
});
test('invalid and unsupported math never returns a guessed answer',()=>{
  for(const input of ['1/0','0/0','sqrt(-1)','2(x+3','x^3=8','x^2+x^3=1','2=2=2','10^999','2+']) assert.equal(tutor.solve(input).title,'Let’s check the question',input);
  assert.equal(tutor.solve('Explain Pythagoras'),null);
  assert.throws(()=>tutor.parse('globalThis.alert(1)'));
  assert.throws(()=>tutor.parse('2'.repeat(301)));
});
test('percentages and statistics compute the supplied values rather than generic examples',()=>{
  assert.equal(tutor.solve('15% of 240').answer,'36');
  assert.equal(tutor.solve('mean of 4, 8, 12').answer,'8');
  assert.equal(tutor.solve('median of 2, 11, 4, 8').answer,'6');
  assert.equal(tutor.solve('mode of 2, 3, 2, 3').answer,'2, 3');
  assert.equal(tutor.solve('mode of 2, 3, 4').answer,'No mode');
  assert(!tutor.render({title:'<img>',answer:'<script>',steps:['<b>'],check:'&'}).includes('<script>'));
});
