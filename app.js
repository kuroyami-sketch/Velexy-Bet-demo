const G=[
['crash','Crash','🚀'],['mines','Mines','💎'],['roulette','Roleta','🎯'],['dice','Dice','🎲'],
['blackjack','Blackjack','🂡'],['tiger','Tiger Fortune','🐯'],['road','Crossy Road','🐔'],['plinko','Plinko','🔻']
];
const STORE='velyxV2';
let S=JSON.parse(localStorage.getItem(STORE)||'null')||{k:1000,r:0,bets:0,wins:0,h:[],lastClaim:null};
let current='',round=null,payMethod='',payPending=0,timers=[];
const fmt=n=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2});
const money=n=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const now=()=>new Date().toLocaleString('pt-BR');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function save(){localStorage.setItem(STORE,JSON.stringify(S));ui()}
function ui(){
topK.textContent=fmt(S.k); heroK.textContent=fmt(S.k); walletK.textContent=fmt(S.k); aK.textContent=fmt(S.k)+' KC';
topR.textContent=money(S.r); heroR.textContent=money(S.r); walletR.textContent=money(S.r); aR.textContent='R$ '+money(S.r);
aBets.textContent=S.bets;aWins.textContent=S.wins;
const claimed=S.lastClaim===today();
dailyStatus.textContent=claimed?'Bônus diário já resgatado hoje.':'100 KC disponíveis para resgate hoje.';
claimMsg.textContent=claimed?'Você já resgatou os 100 KC de hoje.':'Disponível agora: +100 KC.';
hist.innerHTML=S.h.length?S.h.map(x=>`<tr><td>${x.e}</td><td>${x.g}</td><td>${x.w}</td><td>${x.v}</td><td>${x.r}</td><td>${x.d}</td></tr>`).join(''):'<tr><td colspan="6">Nenhuma atividade ainda.</td></tr>';
}
function log(e,g,w,v,r){S.h.unshift({e,g,w,v,r,d:now()});S.h=S.h.slice(0,120)}
function go(v){document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));document.getElementById(v).classList.add('on');document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.v===v))}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>go(b.dataset.v));
function gameCards(list){return list.map(g=>`<div class="card game" onclick="openGame('${g[0]}')"><div class="ico">${g[2]}</div><strong>${g[1]}</strong><small>Interativo · KC / R$ TEST</small></div>`).join('')}
games.innerHTML=gameCards(G);featured.innerHTML=gameCards(G.slice(0,4));
function claimDaily(){
if(S.lastClaim===today()){claimMsg.textContent='Você já resgatou hoje.';return}
S.k+=100;S.lastClaim=today();log('Bônus diário','Daily','K Coin','+100 KC','Resgatado');save()
}
function clearHist(){S.h=[];save()}
function adminAdd(){let a=+adminAmt.value;if(!(a>0))return;if(adminWallet.value==='k'){S.k+=a;log('Crédito admin','Admin','K Coin','+'+fmt(a)+' KC','Teste')}else{S.r+=a;log('Crédito admin','Admin','R$ TEST','+R$ '+money(a),'Teste')}save()}
function resetDemo(){if(!confirm('Resetar todos os saldos e histórico da V2?'))return;S={k:1000,r:0,bets:0,wins:0,h:[],lastClaim:null};save()}
function walletLabel(w){return w==='k'?'K Coin':'R$ TEST'}
function balance(w){return w==='k'?S.k:S.r}
function debit(w,a){if(balance(w)<a)return false;if(w==='k')S.k-=a;else S.r-=a;return true}
function credit(w,a){if(w==='k')S.k+=a;else S.r+=a}
function valueLabel(w,a){return w==='k'?fmt(a)+' KC':'R$ '+money(a)}
function clearTimers(){timers.forEach(t=>clearInterval(t));timers=[]}
function openGame(id){
clearTimers();current=id;round=null;
const g=G.find(x=>x[0]===id);gameTitle.textContent=g[1];
betAmount.value=10;
betControls.classList.remove('hidden');startBtn.disabled=false;
renderIdle();
gameModal.classList.add('on')
}
function closeGame(){clearTimers();gameModal.classList.remove('on');round=null}
function renderIdle(){
const txt={
crash:'O multiplicador sobe até o crash. Inicie e saque antes de explodir.',
mines:'Abra quadrados sem encontrar uma mina e saque quando quiser.',
roulette:'Escolha uma cor e gire a roleta.',
dice:'Escolha acima/abaixo e role o dado.',
blackjack:'Tente chegar mais perto de 21 do que o dealer.',
tiger:'Gire os três rolos e procure combinações.',
road:'Atravesse as faixas e saque antes de ser atingido.',
plinko:'Solte a bola e veja em qual multiplicador ela cai.'
}[current];
gameStage.innerHTML=`<div class="result">Pronto</div><p style="text-align:center">${txt}</p>`;
gameActions.innerHTML='';
}
function startGame(){
let a=+betAmount.value,w=betWallet.value;if(!(a>0)){alert('Informe uma aposta válida.');return}
if(!debit(w,a)){alert('Saldo insuficiente nessa carteira de teste.');return}
S.bets++;round={w,a,done:false};startBtn.disabled=true;save();
if(current==='crash')startCrash();
if(current==='mines')startMines();
if(current==='roulette')startRoulette();
if(current==='dice')startDice();
if(current==='blackjack')startBlackjack();
if(current==='tiger')startTiger();
if(current==='road')startRoad();
if(current==='plinko')startPlinko();
}
function finish(mult,msg){
if(!round||round.done)return;round.done=true;clearTimers();
let pay=round.a*mult;if(pay>0)credit(round.w,pay);
if(pay>round.a)S.wins++;
log('Aposta',G.find(x=>x[0]===current)[1],walletLabel(round.w),valueLabel(round.w,round.a),msg+(pay?' · '+valueLabel(round.w,pay):''));
save();startBtn.disabled=false;
}
function startCrash(){
const crashAt=1.15+Math.random()*4.8;round.mult=1;round.crashAt=crashAt;
gameStage.innerHTML=`<div class="crashwrap"><div class="crashgrid"></div><div class="crashline" id="crashline"></div><div class="rocket" id="rocket">🚀</div><div class="crashmult" id="crashmult">1.00x</div></div>`;
gameActions.innerHTML=`<button class="btn primary" onclick="cashCrash()">Sacar agora</button>`;
let t=setInterval(()=>{if(round.done)return;round.mult+=0.035+round.mult*.004;crashmult.textContent=round.mult.toFixed(2)+'x';let p=Math.min(82,(round.mult-1)*18);rocket.style.left=(17+p*.65)+'%';rocket.style.bottom=(45+p*1.55)+'px';crashline.style.width=(15+p*.75)+'%';crashline.style.transform='rotate('+(-15-p*.45)+'deg)';if(round.mult>=round.crashAt){crashmult.textContent='CRASH '+round.crashAt.toFixed(2)+'x';gameActions.innerHTML='';finish(0,'Crash '+round.crashAt.toFixed(2)+'x')}},90);timers.push(t)
}
function cashCrash(){if(!round||round.done)return;let m=round.mult;gameActions.innerHTML='';crashmult.textContent='SACOU '+m.toFixed(2)+'x';finish(m,'Cash-out '+m.toFixed(2)+'x')}
function startMines(){
round.mines=new Set();while(round.mines.size<3)round.mines.add(Math.floor(Math.random()*25));round.safe=0;round.opened=new Set();
gameStage.innerHTML=`<div class="result" id="mineRes">Multiplicador 1.00x</div><div class="minegrid" id="mineGrid">${Array.from({length:25},(_,i)=>`<button class="mine" onclick="mineClick(${i})">?</button>`).join('')}</div>`;
gameActions.innerHTML=`<button class="btn primary" onclick="cashMines()">Sacar</button>`;
}
function mineClick(i){if(!round||round.done||round.opened.has(i))return;round.opened.add(i);let el=mineGrid.children[i];if(round.mines.has(i)){el.classList.add('bomb');el.textContent='💣';revealMines();mineRes.textContent='BOOM';gameActions.innerHTML='';finish(0,'Mina encontrada');return}round.safe++;el.classList.add('open');el.textContent='💎';round.mult=1+round.safe*.18;mineRes.textContent='Multiplicador '+round.mult.toFixed(2)+'x'}
function revealMines(){round.mines.forEach(i=>{let el=mineGrid.children[i];el.classList.add('bomb');el.textContent='💣'})}
function cashMines(){if(!round||round.done)return;if(!round.safe){alert('Abra pelo menos um quadrado.');return}revealMines();gameActions.innerHTML='';finish(round.mult,'Cash-out '+round.mult.toFixed(2)+'x')}
function startRoulette(){
credit(round.w,round.a);S.bets--;save();round=null;startBtn.disabled=false;
gameStage.innerHTML=`<div class="wheelwrap"><div class="pointer">▼</div><div class="wheel" id="wheel"></div><div class="roulettechoices"><button class="choice red" onclick="roulettePick('red',this)">Vermelho 2x</button><button class="choice black" onclick="roulettePick('black',this)">Preto 2x</button><button class="choice green" onclick="roulettePick('green',this)">Verde 14x</button></div><div class="result" id="rouletteRes">Escolha uma cor</div></div>`;
gameActions.innerHTML=`<button class="btn primary" onclick="spinRoulette()">Girar</button>`;
}
function roulettePick(c,el){roundPick=c;document.querySelectorAll('.choice').forEach(x=>x.classList.remove('sel'));el.classList.add('sel')}
let roundPick='red';
function spinRoulette(){
let a=+betAmount.value,w=betWallet.value;if(!roundPick)return;if(!debit(w,a)){alert('Saldo insuficiente.');return}
S.bets++;round={w,a,done:false,pick:roundPick};save();gameActions.innerHTML='';startBtn.disabled=true;
let n=Math.floor(Math.random()*37),color=n===0?'green':(n%2?'red':'black');
wheel.style.transform=`rotate(${1440+n*13}deg)`;
setTimeout(()=>{rouletteRes.textContent=`Resultado ${n} · ${color==='red'?'Vermelho':color==='black'?'Preto':'Verde'}`;let m=round.pick===color?(color==='green'?14:2):0;finish(m,`Resultado ${n} ${color}`);gameActions.innerHTML=`<button class="btn primary" onclick="spinRoulette()">Girar novamente</button>`},2200)
}
function startDice(){
round.target=50;round.mode='over';
gameStage.innerHTML=`<div class="dicebox" id="diceFace">⚀</div><div class="result" id="diceRes">Escolha e role</div><div class="row" style="justify-content:center"><select id="diceMode"><option value="over">Acima de 50</option><option value="under">Abaixo de 50</option></select></div>`;
gameActions.innerHTML=`<button class="btn primary" onclick="rollDice()">Rolar</button>`;
}
function rollDice(){
if(!round||round.done)return;let v=Math.floor(Math.random()*100)+1;diceFace.classList.add('shake');let faces=['⚀','⚁','⚂','⚃','⚄','⚅'],c=0;let t=setInterval(()=>{diceFace.textContent=faces[c++%6]},80);timers.push(t);setTimeout(()=>{clearInterval(t);diceFace.classList.remove('shake');diceFace.textContent=v;let win=diceMode.value==='over'?v>50:v<50;diceRes.textContent=(win?'Vitória · ':'Derrota · ')+v;gameActions.innerHTML='';finish(win?1.96:0,`${diceMode.value==='over'?'Acima':'Abaixo'} · ${v}`)},850)
}
const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♠','♥','♦','♣'];
function card(){let r=ranks[Math.floor(Math.random()*ranks.length)],s=suits[Math.floor(Math.random()*4)];return{r,s}}
function bjVal(hand){let v=0,a=0;hand.forEach(c=>{if(c.r==='A'){a++;v+=11}else if(['J','Q','K'].includes(c.r))v+=10;else v+=+c.r});while(v>21&&a){v-=10;a--}return v}
function cardHtml(c){return `<div class="playcard ${['♥','♦'].includes(c.s)?'redc':''}">${c.r}${c.s}</div>`}
function renderBJ(hide=false){gameStage.innerHTML=`<div class="score">Dealer ${hide?'?':bjVal(round.d)}</div><div class="cardsline">${round.d.map((c,i)=>hide&&i===1?'<div class="playcard">🂠</div>':cardHtml(c)).join('')}</div><hr style="border-color:#222c39"><div class="score">Você ${bjVal(round.p)}</div><div class="cardsline">${round.p.map(cardHtml).join('')}</div><div class="result" id="bjRes">${hide?'Sua jogada':'Resultado'}</div>`}
function startBlackjack(){round.p=[card(),card()];round.d=[card(),card()];renderBJ(true);gameActions.innerHTML=`<button class="btn primary" onclick="bjHit()">Comprar</button><button class="btn secondary" onclick="bjStand()">Parar</button>`;if(bjVal(round.p)===21)bjStand()}
function bjHit(){round.p.push(card());renderBJ(true);if(bjVal(round.p)>21){renderBJ(false);bjRes.textContent='Estourou';gameActions.innerHTML='';finish(0,'Estourou '+bjVal(round.p))}}
function bjStand(){while(bjVal(round.d)<17)round.d.push(card());renderBJ(false);let p=bjVal(round.p),d=bjVal(round.d),m=0,msg='';if(p>21){msg='Estourou'}else if(d>21||p>d){m=p===21&&round.p.length===2?2.5:2;msg='Você venceu'}else if(p===d){m=1;msg='Empate'}else msg='Dealer venceu';bjRes.textContent=`${msg} · ${p} x ${d}`;gameActions.innerHTML='';finish(m,`${msg} ${p}x${d}`)}
const syms=['🐯','🪙','🍊','🧧','🎋','👑'];
function startTiger(){gameStage.innerHTML=`<div class="slotmachine"><div class="reel" id="r1">🐯</div><div class="reel" id="r2">🪙</div><div class="reel" id="r3">🍊</div></div><div class="result" id="slotRes">Girando...</div>`;gameActions.innerHTML='';[r1,r2,r3].forEach(r=>r.classList.add('spin'));let tt=setInterval(()=>[r1,r2,r3].forEach(r=>r.textContent=syms[Math.floor(Math.random()*syms.length)]),90);timers.push(tt);setTimeout(()=>{clearInterval(tt);let a=[0,1,2].map(()=>syms[Math.floor(Math.random()*syms.length)]);[r1,r2,r3].forEach((r,i)=>{r.classList.remove('spin');r.textContent=a[i]});let m=0;if(a[0]===a[1]&&a[1]===a[2])m=a[0]==='🐯'?8:5;else if(a[0]===a[1]||a[1]===a[2]||a[0]===a[2])m=1.6;slotRes.textContent=m?`Combinação! ${m}x`:'Sem combinação';finish(m,m?'Slot vencedor':'Sem combinação')},1600)}
function startRoad(){round.step=0;round.mult=1;gameStage.innerHTML=`<div class="road" id="roadBoard">${Array.from({length:5},(_,i)=>`<div class="lane"><div class="chicken" id="ch${i}">${i===0?'🐔':''}</div><div class="car" style="animation-delay:${i*.18}s">${i%2?'🚙':'🚗'}</div></div>`).join('')}<div class="finishline">🏁 CHEGADA</div></div><div class="result" id="roadRes">Faixa 0/5 · 1.00x</div>`;gameActions.innerHTML=`<button class="btn primary" onclick="roadStep()">Avançar uma faixa</button><button class="btn secondary" onclick="cashRoad()">Sacar</button>`}
function roadStep(){if(round.done||round.step>=5)return;let idx=round.step;document.getElementById('ch'+idx).textContent='🐔';setTimeout(()=>document.getElementById('ch'+idx).style.left='78%',20);let hit=Math.random()<(.13+round.step*.025);setTimeout(()=>{if(hit){roadRes.textContent='💥 Atropelado';gameActions.innerHTML='';finish(0,'Atropelado na faixa '+(round.step+1));return}round.step++;round.mult=1+round.step*.38;roadRes.textContent=`Faixa ${round.step}/5 · ${round.mult.toFixed(2)}x`;if(round.step===5){gameActions.innerHTML='';finish(round.mult,'Chegou ao outro lado '+round.mult.toFixed(2)+'x')}},420)}
function cashRoad(){if(round.step<1){alert('Atravesse pelo menos uma faixa.');return}gameActions.innerHTML='';finish(round.mult,'Cash-out faixa '+round.step)}
function buildPegs(){let s='';for(let row=0;row<8;row++){let count=5+row;for(let i=0;i<count;i++){let left=8+(i+0.5)*(84/count);let top=20+row*30;s+=`<i class="peg" style="left:${left}%;top:${top}px"></i>`}}return s}
function startPlinko(){gameStage.innerHTML=`<div class="plinko" id="plinkoBoard">${buildPegs()}<div class="ball" id="pball" style="left:49%;top:5px"></div><div class="bins">${['4x','2x','1.4x','0x','1.4x','2x','4x'].map(x=>`<div class="bin">${x}</div>`).join('')}</div></div><div class="result" id="plinkoRes">Caindo...</div>`;gameActions.innerHTML='';let col=3,pos=49,row=0;let t=setInterval(()=>{row++;col+=Math.random()<.5?-1:1;col=Math.max(0,Math.min(6,col));pos=7+col*14;pball.style.left=pos+'%';pball.style.top=(5+row*31)+'px';if(row>=8){clearInterval(t);let mult=[4,2,1.4,0,1.4,2,4][col];plinkoRes.textContent=`Caiu em ${mult}x`;finish(mult,'Plinko '+mult+'x')}},230);timers.push(t)}
function openPay(m){payMethod=m;payPending=0;payTitle.textContent=m+' TEST';payFlow.classList.add('hidden');payProg.style.width='0';payModal.classList.add('on')}
function closePay(){payModal.classList.remove('on')}
function createSandboxPayment(){let a=+payAmount.value;if(!(a>0)){alert('Informe um valor válido.');return}payPending=a;payFlow.classList.remove('hidden');payCode.textContent=`VELYX-${payMethod.toUpperCase()}-TEST-${Date.now()}-${Math.random().toString(36).slice(2,10).toUpperCase()}`;setTimeout(()=>payProg.style.width='100%',30)}
function confirmSandboxPayment(){if(!(payPending>0))return;S.r+=payPending;log('Pagamento sandbox',payMethod,'R$ TEST','+R$ '+money(payPending),'Confirmado em teste');save();alert('Pagamento de teste confirmado. Saldo R$ TEST atualizado.');closePay();payPending=0}
ui();