'use strict';
/* ===== Konfigurasi (mudah diedit) ===== */
const C=6,R=5,BETS=[10,20,50,100,200,500,1000],LAD=[1,2,3,5,10],START=10000;
// p = pembayaran untuk 3,4,5,6 kolom (x bet / 10 x jumlah ways). w = bobot kemunculan
const SY=[
 {g:'萬',n:'Character',c:'#c1121f',w:24,p:[.2,.5,1,2]},
 {g:'條',n:'Bamboo',c:'#1b8a5a',w:24,p:[.2,.5,1,2]},
 {g:'筒',n:'Circle',c:'#1d4ed8',w:20,p:[.3,.6,1.5,3]},
 {g:'風',n:'Wind',c:'#7c3aed',w:14,p:[.5,1,2.5,5]},
 {g:'花',n:'Special',c:'#db2777',w:10,p:[.8,2,5,10]},
 {g:'龍',n:'Dragon',c:'#b45309',w:6,p:[1.5,4,10,25]},
 {g:'百',n:'Wild',c:'#9a1b0b',w:4,wild:1},
 {g:'福',n:'Scatter',c:'#ffe27a',w:3,sc:1}];
const FS_AWARD={3:8,4:12,5:16,6:20};
/* ===== State ===== */
const $=i=>document.getElementById(i),root=document.documentElement;
let bal=START,bi=3,bet=BETS[bi],fs=0,mi=0,G=[],busy=false,auto=false,turbo=false,shown=0;
try{bal=+localStorage.getItem('mjr_bal')||START}catch(e){}
const spd=()=>turbo?2.2:1,sl=ms=>new Promise(r=>setTimeout(r,ms/spd()));
const fmt=n=>Math.round(n).toLocaleString('id-ID');
function save(){try{localStorage.setItem('mjr_bal',bal)}catch(e){}}
function ui(){$('bal').textContent=fmt(bal);$('bet').textContent=fmt(bet);
 [...$('ladder').children].forEach((e,i)=>e.classList.toggle('on',i==mi));save()}
const say=t=>$('marq').textContent=t;
/* ===== Tile ===== */
function pick(c){let t=0;const w=SY.map(s=>{const x=s.wild&&(c==0||c==5)?0:s.w;t+=x;return x});
 let x=Math.random()*t;for(let i=0;i<w.length;i++){if((x-=w[i])<0)return i}return 0}
function mk(c,s){const el=document.createElement('div'),y=SY[s];
 el.className='t'+(y.wild?' W':'')+(y.sc?' S':'');el.style.left=c*100/C+'%';
 el.innerHTML=`<div class="f" style="color:${y.c}">${y.g}<small>${y.wild?'WILD':y.sc?'SCATTER':''}</small></div>`;
 return {s,c,el}}
function put(t,r,delay=0){t.el.style.transitionDelay=delay/spd()+'ms';t.el.style.transform=`translateY(${r*100}%)`}
function spawn(c,k,base){const a=[];for(let r=0;r<k;r++){const t=mk(c,pick(c));
 t.el.style.transform=`translateY(${(r-k-1)*100}%)`;$('cols').appendChild(t.el);a.push(t)}
 void $('cols').offsetWidth;return a}
/* ===== Evaluasi ways ===== */
function evaluate(){let amt=0;const mark=new Set();
 for(let s=0;s<6;s++){const cnt=[];
  for(let c=0;c<C;c++){const m=G[c].filter(t=>t.s==s||SY[t.s].wild);if(!m.length)break;cnt.push(m)}
  if(cnt.length>=3){amt+=bet*SY[s].p[cnt.length-3]*cnt.reduce((a,m)=>a*m.length,1)/10;cnt.forEach(m=>m.forEach(t=>mark.add(t)))}}
 return{amt:Math.round(amt),mark}}
/* ===== Efek ===== */
function burst(t){const b=$('board').getBoundingClientRect(),r=t.el.getBoundingClientRect();
 for(let i=0;i<7;i++){const p=document.createElement('b'),a=Math.random()*6.28,d=30+Math.random()*50;
  p.style.left=r.left-b.left+r.width/2+'px';p.style.top=r.top-b.top+r.height/2+'px';
  p.style.setProperty('--x',Math.cos(a)*d+'px');p.style.setProperty('--y',Math.sin(a)*d+'px');
  $('fx').appendChild(p);setTimeout(()=>p.remove(),650)}}
function shake(){const b=$('board');b.classList.remove('sh');void b.offsetWidth;b.classList.add('sh')}
async function banner(t,ms=1500){const b=$('banner');b.textContent=t;b.classList.add('on');await sl(ms);b.classList.remove('on');await sl(300)}
function tween(to){const from=shown,t0=performance.now(),dur=500/spd();
 return new Promise(res=>{(function f(n){const k=Math.min(1,(n-t0)/dur);shown=from+(to-from)*k;$('win').textContent=fmt(shown);k<1?requestAnimationFrame(f):res()})(t0)})}
/* ===== Putaran ===== */
async function spin(){
 if(busy)return;
 if(fs==0){if(bal<bet){say('Saldo kurang. Turunkan bet atau reset saldo di menu.');auto=false;$('auto').classList.remove('on');return}bal-=bet}else fs--;
 busy=true;$('spin').disabled=true;if(fs==0&&!G.length||fs>=0&&!inFS)mi=0;
 root.style.setProperty('--d',.35/spd()+'s');shown=0;$('win').textContent=0;say(fs>0?`FREE SPIN tersisa ${fs}`:'Memutar…');ui();
 // reel lama jatuh keluar
 G.forEach((col,c)=>col.forEach((t,r)=>put(t,R+2+r,c*40)));await sl(450);$('cols').innerHTML='';
 // reel baru berhenti satu per satu
 G=[];for(let c=0;c<C;c++){G[c]=spawn(c,R);}
 G.forEach((col,c)=>col.forEach((t,r)=>put(t,r,c*130+r*35)));await sl(C*130+600);
 // cascade
 let total=0,n=0;
 for(;;){const e=evaluate();if(!e.amt)break;n++;
  const gain=e.amt*LAD[mi];total+=gain;say(`Cascade ${n}  ×${LAD[mi]}  +${fmt(gain)}`);
  e.mark.forEach(t=>t.el.classList.add('win'));await sl(600);
  e.mark.forEach(t=>{t.el.classList.remove('win');t.el.classList.add('out');burst(t)});if(n>=3||gain>=bet*5)shake();
  tween(total);await sl(400);
  e.mark.forEach(t=>t.el.remove());
  for(let c=0;c<C;c++){const keep=G[c].filter(t=>!e.mark.has(t)),k=R-keep.length,nw=spawn(c,k);
   G[c]=[...nw,...keep];G[c].forEach((t,r)=>put(t,r,c*30+(k?0:0)))}
  if(mi<LAD.length-1)mi++;ui();await sl(650)}
 if(total){bal+=total;await tween(total)}
 // scatter
 const sc=G.flat().filter(t=>SY[t.s].sc);
 if(sc.length>=3){sc.forEach(t=>t.el.classList.add('hot'));const add=FS_AWARD[Math.min(sc.length,6)];
  await banner(`${sc.length} SCATTER\nFREE SPIN +${add}`,1800);fs+=add;inFS=true;sc.forEach(t=>t.el.classList.remove('hot'))}
 if(fs==0){inFS=false;mi=0}
 say(total?`Menang ${fmt(total)}`:'Coba lagi');ui();busy=false;$('spin').disabled=false;
 if(fs>0||auto){await sl(total?900:500);if(fs>0||auto)spin()}
}
let inFS=false;
/* ===== Kontrol ===== */
$('spin').onclick=spin;
$('up').onclick=()=>{if(!busy&&bi<BETS.length-1){bet=BETS[++bi];ui()}};
$('dn').onclick=()=>{if(!busy&&bi>0){bet=BETS[--bi];ui()}};
$('turbo').onclick=e=>{turbo=!turbo;e.currentTarget.classList.toggle('on',turbo)};
$('auto').onclick=e=>{auto=!auto;e.currentTarget.classList.toggle('on',auto);if(auto)spin()};
$('menu').onclick=()=>{$('pt').innerHTML='<h3 style="margin:0 0 6px;color:#f6c945">Paytable</h3>'+SY.filter(s=>s.p).reverse().map(s=>`<div class="pr"><div class="f" style="color:${s.c}">${s.g}</div><div>${s.n}<br>3/4/5/6 kolom: ${s.p.join(' / ')}</div></div>`).join('')+
 '<div class="pr"><div class="f" style="color:#9a1b0b;background:#f6c945">百</div><div>Wild menggantikan semua simbol kecuali Scatter (kolom 2–5).</div></div><div class="pr"><div class="f" style="color:#ffe27a;background:#b3121f">福</div><div>Scatter: 3 = 8, 4 = 12, 5+ = 16 Free Spin. Multiplier tetap naik selama Free Spin.</div></div><p style="font-size:12px">Menang jika simbol sama muncul di 3+ kolom berurutan dari kiri, di baris mana pun (15.625 ways). Pembayaran = bet × nilai × jumlah ways ÷ 10. Koin virtual, hanya hiburan.</p>';$('dlg').showModal()};
$('close').onclick=()=>$('dlg').close();
$('reset').onclick=()=>{bal=START;ui();$('dlg').close()};
// papan awal
for(let c=0;c<C;c++){G[c]=spawn(c,R);G[c].forEach((t,r)=>put(t,r))}
ui();
