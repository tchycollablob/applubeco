// Formules transcrites des documents utilisateur. Toutes les entrées internes sont en SI.
export const units = {
  wavelength: {nm:1e-9,'µm':1e-6,m:1}, power:{mW:1e-3,W:1,kW:1e3},
  frequency:{Hz:1,kHz:1e3,MHz:1e6}, time:{s:1,ms:1e-3,'µs':1e-6,ns:1e-9,ps:1e-12},
  length:{m:1,cm:1e-2,mm:1e-3,'µm':1e-6}, angle:{rad:1,mrad:1e-3,'°':Math.PI/180},
  energy:{J:1,mJ:1e-3,'µJ':1e-6}, irradiance:{'W/m²':1,'W/cm²':1e4}, fluence:{'J/m²':1,'J/cm²':1e4}
};
export function convert(value, from, to, kind) { return value*units[kind][from]/units[kind][to]; }
export const area = d => Math.PI*(d/2)**2;
export function factors(nm, alpha=1.5) {
  return {ca:nm<700?1:nm<1050?10**(.002*(nm-700)):5,
    cb:nm<=450?1:10**(.02*(nm-450)),cc:nm<=1150?1:nm<1200?10**(.018*(nm-1150)):8,
    ce:alpha<=1.5?1:alpha<=100?alpha/1.5:alpha**2/150,
    t2:alpha<=1.5?10:alpha>=100?100:10*10**((alpha-1.5)/98.5)};
}
// Résultat exprimé en J/m² ; les limites d'éclairement sont multipliées par t.
// Aux frontières, on retient le minimum des expressions adjacentes disponibles.
export function vle(nm,t,alpha=1.5) {
  nm=Number(nm.toPrecision(12));t=Number(t.toPrecision(12));
  if (!(nm>=180 && nm<=1e6 && t>=1e-9 && t<=30000 && alpha>0)) return null;
  const {ca,cb,cc,ce}=factors(nm,alpha), limits=[];
  const add=(condition,value)=>{if(condition) limits.push(value);};
  const uv=[40,60,100,160,250,400,630,1000,1600,2500,4000,6300];
  if(t<=10){
    add(nm<=302,30);
    if(nm>=303&&nm<=314&&Number.isInteger(nm)) limits.push(Math.min(uv[nm-303],5600*t**.25));
    add(nm>=315&&nm<=400,5600*t**.25);
    add(nm>=400&&nm<=700&&t<=18e-6,.005*ce);
    add(nm>=400&&nm<=700&&t>=18e-6,18*t**.75*ce);
    add(nm>=700&&nm<=1050&&t<=18e-6,.005*ca);
    add(nm>=700&&nm<=1050&&t>=18e-6,18*t**.75*ca*ce);
    add(nm>=1050&&nm<=1400&&t<=50e-6,.05*cc*ce);
    add(nm>=1050&&nm<=1400&&t>=50e-6,90*t**.75*cc*ce);
    for(const [lo,hi] of [[1400,1500],[1800,2600]]){
      add(nm>=lo&&nm<=hi&&t<=1e-3,1000);
      add(nm>=lo&&nm<=hi&&t>=1e-3,5600*t**.25);
    }
    add(nm>=1500&&nm<=1800,10000);
    add(nm>=2600&&t<=1e-7,100);
    add(nm>=2600&&t>=1e-7,5600*t**.25);
  }
  if(t>=10){
    add(nm<=302,30);
    if(nm>=303&&nm<=314&&Number.isInteger(nm)) limits.push(uv[nm-303]);
    add(nm>=315&&nm<=400,1e4);
    // Les extraits ne permettent pas de traiter les sources étendues longues.
    if(alpha<1.5){
      add(nm>=400&&nm<=700,10*t);
      add(nm>=700&&nm<=1400,10*ca*cc*t);
    }
    add(nm>=400&&nm<=600,t<=100?100*cb:cb*t);
    add(nm>=1400,1000*t);
    if(nm>=400&&nm<=1400&&alpha>=1.5) return null;
  }
  return limits.length?Math.min(...limits):null;
}
export function divergence(lambda,d,m2){return 4*m2*lambda/(Math.PI*d);}
export function dndo(quantity,limit,d,phi,model='linear'){
  if(![quantity,limit,d,phi].every(x=>Number.isFinite(x)&&x>0)) return null;
  const critical2=4*quantity/(Math.PI*limit);
  return model==='quadratic'?Math.sqrt(Math.max(0,critical2-d*d))/phi:Math.max(0,(Math.sqrt(critical2)-d)/phi);
}
export function lb(value,mode){
  if(!(value>0&&Number.isFinite(value))) return null;
  const base=mode==='D'?100:.05;
  for(let n=1;n<=10;n++) if(value<=base*10**(n-1)*(1+1e-12)) return n;
  return '>10';
}
export function calculate(p){
  const required=['lambda','power','diameter'];
  if(required.some(k=>!Number.isFinite(p[k])||p[k]<(k==='distance'?0:Number.MIN_VALUE))) throw Error('Renseignez des valeurs strictement positives (distance ≥ 0).');
  if(p.pulsed&&(!(p.frequency>0)||!(p.pulse>0)||p.frequency*p.pulse>1)) throw Error('Fréquence et durée positives requises ; f × τ doit être ≤ 1.');
  if(!(p.alpha>0&&Number.isFinite(p.alpha))) throw Error('L’angle apparent α doit être positif et fini.');
  if(p.pulsed&&!Number.isNaN(p.groups)&&!(p.groups>=1&&Number.isInteger(p.groups))) throw Error('N doit être un nombre entier de groupes ≥ 1, ou rester vide.');
  const missing=v=>v==null||Number.isNaN(v);
  for(const key of ['exposure','aperture','distance']){
    if(!missing(p[key])&&(!Number.isFinite(p[key])||(key==='distance'?p[key]<0:p[key]<=0))) throw Error('Les valeurs optionnelles renseignées doivent être positives (distance ≥ 0).');
  }
  const manual=p.phiMode==='manual'&&!missing(p.phi);
  if(manual&&!(p.phi>0&&Number.isFinite(p.phi))) throw Error('La divergence totale doit être positive.');
  if(!manual&&!missing(p.m2)&&!(p.m2>=1&&Number.isFinite(p.m2))) throw Error('Le facteur M² doit être supérieur ou égal à 1.');
  const phi=manual?p.phi:missing(p.m2)?null:divergence(p.lambda,p.diameter,p.m2);
  const phiSource=manual?'manual':phi===null?'missing':'derived';
  const nm=Number((p.lambda*1e9).toPrecision(12)),s=area(p.diameter),q=p.pulsed?p.power/p.frequency:null;
  const h=missing(p.exposure)?null:vle(nm,p.exposure,p.alpha), hp=p.pulsed?vle(nm,p.pulse,p.alpha):null;
  const dz=missing(p.distance)?null:p.distance===0?p.diameter:phi===null?null:p.model==='linear'?p.diameter+phi*p.distance:Math.hypot(p.diameter,phi*p.distance);
  const k=missing(p.aperture)||dz===null?null:Math.min(1,(p.aperture/dz)**2);
  const cumulative=h===null?null:dndo(p.power*p.exposure,h,p.diameter,phi,p.model);
  const single=hp===null?null:dndo(q,hp,p.diameter,phi,p.model);
  const n=p.groups,cp=p.pulsed&&n>=1? n**(-.25):null;
  const thermal=hp!==null&&cp!==null?dndo(q,hp*cp,p.diameter,phi,p.model):null;
  const distances=[cumulative,single,thermal].filter(x=>x!==null);
  return {phi,phiSource,s,q,peak:q===null?null:q/p.pulse,total:missing(p.exposure)?null:p.power*p.exposure,h,hp,cp,
    irradiance:p.power/s,fluence:q===null?null:q/s,k,accessiblePower:k===null?null:p.power*k,
    accessibleEnergy:q===null||k===null?null:q*k,cumulative,single,thermal,
    dndo:distances.length?Math.max(...distances):null,
    lbD:nm>315&&nm<=1400?lb(p.power/s,'D'):null,
    lbPulse:nm>315&&nm<=1400&&p.pulsed&&p.pulse>=1e-9&&p.pulse<=.25?lb(q/s,'R'):null,
    factors:factors(nm,p.alpha)};
}
