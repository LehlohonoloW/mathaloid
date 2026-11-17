/* Deterministic, offline worked mathematics. No dynamic code execution. */
"use strict";
const MathTutor = (() => {
  const format = n => Object.is(n, -0) ? "0" : Number.isInteger(n) ? String(n) : Number(n.toPrecision(10)).toString();
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => s.toLowerCase().replace(/−|–/g, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\*\*/g, '^');
  const result = (title, answer, steps, check = '') => ({ title, answer, steps, check });
  function parse(source) {
    if (source.length > 300) throw Error('Please use an expression shorter than 300 characters.');
    const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|sqrt|pi|[x()+*/^%\-]/g) || [];
    if (tokens.join('') !== source.replace(/\s/g, '')) throw Error('I could not read that expression. Use numbers, x, parentheses, +, -, *, /, ^ or sqrt(...).');
    let pos = 0;
    const steps = [];
    const scalar = p => p[1] === 0 && p[2] === 0;
    const safe = p => { if (!p.every(Number.isFinite)) throw Error('That calculation exceeds the supported number range.'); return p; };
    function combine(a, b, op) {
      let out;
      if (op === '+' || op === '-') out = a.map((v, i) => v + (op === '+' ? b[i] : -b[i]));
      if (op === '*') {
        const full = [0,0,0,0,0];
        a.forEach((v,i) => b.forEach((w,j) => { full[i+j] += v*w; }));
        if (full[3] || full[4]) throw Error('I can solve polynomials up to degree 2 here.');
        out = full.slice(0,3);
      }
      if (op === '/') {
        if (!scalar(b)) throw Error('Division by an expression containing x is not supported here.');
        if (b[0] === 0) throw Error('Division by zero is undefined. Check the denominator.');
        out = a.map(v => v/b[0]);
      }
      safe(out);
      if (scalar(a) && scalar(b) && steps.length < 12) steps.push(`${format(a[0])} ${op} ${format(b[0])} = ${format(out[0])}`);
      return out;
    }
    function atom() {
      const t = tokens[pos++];
      if (t === '(') { const v = sum(); if (tokens[pos++] !== ')') throw Error('A closing parenthesis is missing.'); return v; }
      if (t === 'x') return [0,1,0];
      if (t === 'pi') return [Math.PI,0,0];
      if (t === 'sqrt') { if(tokens[pos++] !== '(') throw Error('Write a square root as sqrt(25).'); const p = sum(); if(tokens[pos++] !== ')' || !scalar(p)) throw Error('Use a numeric value inside sqrt(...).'); if(p[0]<0) throw Error('A negative number has no real square root.'); const v=Math.sqrt(p[0]); steps.push(`sqrt(${format(p[0])}) = ${format(v)}`); return [v,0,0]; }
      if (t && /^(\d|\.)/.test(t)) return safe([Number(t),0,0]);
      throw Error('An expression is incomplete. Check the numbers and operators.');
    }
    function power() {
      let a = atom();
      if (tokens[pos] === '^') {
        pos++; const b = unary();
        if (!scalar(b)) throw Error('An exponent must be a number here.');
        if (scalar(a)) { const v = a[0] ** b[0]; steps.push(`${format(a[0])}^${format(b[0])} = ${format(v)}`); a = safe([v,0,0]); }
        else { if (![0,1,2].includes(b[0])) throw Error('Use powers 0, 1 or 2 for expressions containing x.'); a = b[0] === 0 ? [1,0,0] : b[0] === 1 ? a : combine(a,a,'*'); }
      }
      if(tokens[pos] === '%') { pos++; a = a.map(v => v/100); }
      return a;
    }
    function unary() { if(tokens[pos] === '+') {pos++;return unary();} if(tokens[pos] === '-') {pos++;return unary().map(v=>-v);} return power(); }
    function product() {
      let a = unary();
      while (pos < tokens.length) {
        const t = tokens[pos];
        if (t === '*' || t === '/') { pos++; a = combine(a,unary(),t); }
        else if (t === 'x' || t === '(' || t === 'sqrt' || t === 'pi') a = combine(a,unary(),'*');
        else break;
      }
      return a;
    }
    function sum() { let a = product(); while(tokens[pos] === '+' || tokens[pos] === '-') {const op=tokens[pos++];a=combine(a,product(),op);} return a; }
    const coefficients = sum();
    if(pos !== tokens.length) throw Error('There is an unexpected symbol or missing operator.');
    return { coefficients, steps };
  }
  function solve(input) {
    let source = normalize(input.trim()).replace(/\?$/, '').replace(/^(?:please\s+)?(?:solve(?:\s+for\s+x)?|calculate|evaluate|what is|what's|work out)\s*:?\s*/, '').trim();
    const mathLike = /^[\d.x()+*/^%\s=\-]+$/.test(source.replace(/sqrt|pi/g, '')) || /^(?:sqrt|pi)\b/.test(source);
    const fraction = source.match(/^([+-]?\d+)\s*\/\s*(\d+)\s*([+*/-])\s*([+-]?\d+)\s*\/\s*(\d+)$/);
    if (fraction) {
      const [,ns,ds,op,ms,es] = fraction, n=+ns,d=+ds,m=+ms,e=+es;
      if (!d || !e || (op==='/' && !m)) return result('Let’s check the question','Division by zero is undefined.',[]);
      let numerator=op==='+'?n*e+m*d:op==='-'?n*e-m*d:op==='*'?n*m:n*e;
      let denominator=op==='/'?d*m:d*e;
      if (![numerator,denominator].every(Number.isSafeInteger)) return result('Let’s check the question','These fractions exceed the exact whole-number range.',[]);
      if (denominator<0) { numerator=-numerator; denominator=-denominator; }
      let a=Math.abs(numerator),b=denominator;while(b){const r=a%b;a=b;b=r;}
      const top=numerator/a,bottom=denominator/a;
      const steps=op==='+'||op==='-'?[`Use the common denominator ${d*e}: ${n*e}/${d*e} ${op} ${m*d}/${d*e}`,`Combine the numerators: ${numerator}/${denominator}`]:[op==='/'?`Multiply by the reciprocal: (${n}/${d}) × (${e}/${m}) = ${numerator}/${denominator}`:`Multiply numerators and denominators: ${numerator}/${denominator}`];
      steps.push(`Divide numerator and denominator by ${a}: ${top}/${bottom}`);
      return result('Fractions',bottom===1?String(top):`${top}/${bottom}`,steps,`Decimal approximation: ${format(top/bottom)}.`);
    }
    let m = source.match(/^([+-]?[\d.]+)\s*%\s*of\s*([+-]?[\d.]+)$/);
    if(m) {const p=Number(m[1]), n=Number(m[2]); if(!Number.isFinite(p*n)) return result('Check the numbers','This percentage is outside the supported range.',[]); return result('Percentage',format(p*n/100),[`${format(p)}% = ${format(p/100)}`,`${format(p/100)} × ${format(n)} = ${format(p*n/100)}`], 'Percent means out of 100.');}
    m=source.match(/^(mean|median|mode)\s+(?:of\s+)?([\d.,\s-]+)$/);
    if(m) {const values=m[2].split(/[\s,]+/).filter(Boolean).map(Number); if(!values.length || !values.every(Number.isFinite)) return result('Check your data','Use a list of numbers separated by commas.',[]); const sorted=[...values].sort((a,b)=>a-b); const total=values.reduce((a,b)=>a+b,0); if(!Number.isFinite(total)) return result("Check your data","These values exceed the supported number range.",[]); let answer;
      if(m[1]==='mean') answer=format(total/values.length);
      if(m[1]==='median') answer=format((sorted[Math.floor((values.length-1)/2)]+sorted[Math.floor(values.length/2)])/2);
      if(m[1]==='mode') {const counts=new Map();values.forEach(v=>counts.set(v,(counts.get(v)||0)+1));const max=Math.max(...counts.values());answer=max===1?'No mode':Array.from(counts).filter(([,n])=>n===max).map(([v])=>format(v)).join(', ');}
      return result(m[1],answer,[`Sorted data: ${sorted.map(format).join(', ')}`,m[1]==='mean'?`Total ${format(total)} ÷ ${values.length} values = ${answer}`:m[1]==='median'?'Take the middle value; average the two middle values when the count is even.':'Count how often each value occurs; report all values tied for the highest count.']);
    }
    if(!mathLike) return null;
    try {
      if(source.includes('=')) {
        const sides=source.split('=');if(sides.length!==2) throw Error('Please enter one equation with a single equals sign.');
        const L=parse(sides[0]).coefficients,R=parse(sides[1]).coefficients;
        const [c,b,a]=L.map((v,i)=>v-R[i]);
        if(a===0 && b===0) return result('Equation',c===0?'Every real x is a solution':'No solution',[c===0?'Both sides simplify to the same expression.':`Subtracting the two sides gives ${format(c)} = 0, which is false.`]);
        if(a===0) {const x=-c/b;if(!Number.isFinite(x)) throw Error("That solution exceeds the supported number range.");const left=L[0]+L[1]*x,right=R[0]+R[1]*x;return result('Linear equation',`x = ${format(x)}`,[`Subtract the right-hand expression from both sides: ${format(b)}x + (${format(c)}) = 0`,`Subtract ${format(c)} from both sides: ${format(b)}x = ${format(-c)}`,`Divide both sides by ${format(b)}: x = ${format(x)}`],`Substitute x ${Number.isInteger(x)?'=':'≈'} ${format(x)}: left side ${format(left)}, right side ${format(right)}.`);}
        const d=b*b-4*a*c;
        if(!Number.isFinite(d)) throw Error("These coefficients exceed the supported number range.");
        const steps=[`Collect terms: (${format(a)})x² + (${format(b)})x + (${format(c)}) = 0`,`Discriminant: b² − 4ac = (${format(b)})² − 4(${format(a)})(${format(c)}) = ${format(d)}`,'Use x = (−b ± √D) / (2a).'];
        if(d<0)return result('Quadratic equation','No real solutions',steps,`Complex solutions: x = ${format(-b/(2*a))} ± ${format(Math.sqrt(-d)/Math.abs(2*a))}i.`);
        const roots=[(-b+Math.sqrt(d))/(2*a),(-b-Math.sqrt(d))/(2*a)];
        return result('Quadratic equation',d===0?`x = ${format(roots[0])} (repeated root)`:`x = ${format(roots[0])} or x = ${format(roots[1])}`,steps,`Substitution in the collected polynomial gives ${roots.map(x=>format(a*x*x+b*x+c)).join(' and ')} (rounding may apply).`);
      }
      const {coefficients:p,steps}=parse(source);
      if(p[1] || p[2]) return result('Expression','What would you like to find?',['To solve for x, include an equals sign, for example 2x + 3 = 11.']);
      return result('Calculation',format(p[0]),steps.length?steps:['This is already a single number.'],'Parentheses first, then powers, then multiplication/division, then addition/subtraction. Non-terminating decimals are rounded to 10 significant figures.');
    } catch(error) {return result('Let’s check the question',error.message,[],'Edit the expression and try again. No result has been guessed.');}
  }
  function render(r) {return `<div class="worked-answer"><span class="answer-label">${escape(r.title)}</span><strong class="answer-result">${escape(r.answer)}</strong>${r.steps.length?`<ol>${r.steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol>`:''}${r.check?`<p class="answer-check">${escape(r.check)}</p>`:''}</div>`;}
  return { solve, parse, render, normalize };
})();
