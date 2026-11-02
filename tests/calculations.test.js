import {test} from 'node:test';
import assert from 'node:assert/strict';
import {convert,divergence,vle,dndo,lb,calculate} from '../calculations.js';
const near=(actual,expected,eps=1e-6)=>assert.ok(Math.abs(actual-expected)<=eps,`${actual} ≠ ${expected}`);
const p={lambda:1064e-9,power:1,diameter:.002,exposure:.25,aperture:.007,distance:.2,alpha:1,m2:1.5,phiMode:'derived',phi:.001,model:'linear',pulsed:true,pulse:100e-9,frequency:20000,groups:NaN};
test('Conversions multi-échelles préservent la grandeur',()=>{near(convert(1,'J/cm²','J/m²','fluence'),10000);near(convert(100,'ns','s','time'),1e-7);near(convert(convert(2,'mm','m','length'),'m','mm','length'),2);});
test('Exemples du cahier : divergence et VLE 1064 nm',()=>{near(divergence(1064e-9,.002,1.5)*1000,1.016045156,1e-8);near(vle(1064,.25,1),31.819805153,1e-8);near(vle(1064,100e-9,1),.05);});
test('Exemple DNDO du cahier et absence de distance négative',()=>{near(dndo(1,10,.002,.001),354.82482323,1e-7);assert.equal(dndo(.00001,100,.1,.001),0);assert.equal(dndo(1,10,.002,0),null);});
test('Les frontières communes retiennent la valeur restrictive',()=>{near(vle(1064,50e-6,1),Math.min(.05,90*(50e-6)**.75));near(vle(400,.25,1),Math.min(5600*.25**.25,18*.25**.75));near(vle(700,1e-9,1),.005);});
test('Domaines manquants ne produisent aucune VLE',()=>{assert.equal(vle(1064,1e-12,1),null);assert.equal(vle(302.5,1,1),null);assert.equal(vle(1064,100,2),null);assert.equal(vle(100,1,1),null);});
test('Échelons EN 207 : exemples corrigés et dépassement',()=>{assert.equal(lb(250*1e4,'D'),6);assert.equal(lb(.8*1e4,'R'),7);assert.equal(lb(100,'D'),1);assert.equal(lb(1e12,'D'),'>10');});
test('Source pulsée et ouverture : unités SI cohérentes',()=>{const r=calculate(p);near(r.q,5e-5);near(r.peak,500);near(r.total,.25);assert.equal(r.k,1);near(r.accessibleEnergy,r.q);assert.equal(r.cp,null);assert.equal(r.thermal,null);});
test('Correction thermique uniquement si N fourni',()=>{const r=calculate({...p,groups:16});near(r.cp,.5);assert.ok(r.thermal>r.single);});
test('Puissance interceptée par une ouverture centrée large faisceau',()=>{const r=calculate({...p,diameter:.014,distance:0});near(r.k,.25);near(r.accessiblePower,.25);});
test('Saisies impossibles refusées',()=>{assert.throws(()=>calculate({...p,power:-1}));assert.throws(()=>calculate({...p,pulse:1}));assert.throws(()=>calculate({...p,m2:.5}));});
test('Champs optionnels vides : les calculs indépendants restent disponibles',()=>{
  const r=calculate({...p,exposure:NaN,aperture:NaN,distance:NaN,phi:NaN});
  near(r.q,5e-5);near(r.phi,divergence(p.lambda,p.diameter,p.m2));
  for(const key of ['h','total','k','accessiblePower','accessibleEnergy','cumulative']) assert.equal(r[key],null,key);
  assert.ok(r.single>0);assert.equal(r.dndo,r.single);assert.equal(r.hp,.05);
});
test('Divergence fabricant facultative : repli automatique et priorité manuelle',()=>{
  const r=calculate({...p,phiMode:'manual',phi:NaN});near(r.phi,divergence(p.lambda,p.diameter,p.m2));assert.equal(r.phiSource,'derived');
  const manual=calculate({...p,phiMode:'manual',phi:.002,m2:NaN});assert.equal(manual.phi,.002);assert.equal(manual.phiSource,'manual');
});
test('Absence de divergence calculable ne bloque pas les densités',()=>{
  const r=calculate({...p,m2:NaN});assert.equal(r.phi,null);assert.equal(r.dndo,null);assert.equal(r.accessiblePower,null);assert.ok(r.irradiance>0);
  const origin=calculate({...p,m2:NaN,distance:0});assert.equal(origin.k,1);
});
test('Champs optionnels invalides refusés, sans remplacer le vide par zéro',()=>{
  for(const key of ['exposure','aperture','distance']) assert.throws(()=>calculate({...p,[key]:-1}));
  const cw=calculate({...p,pulsed:false,exposure:NaN});assert.equal(cw.dndo,null);assert.equal(cw.total,null);
  assert.equal(calculate({...p,aperture:NaN}).accessiblePower,null);
});
