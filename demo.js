const demand=[38,37,36,36,38,42,50,58,65,70,72,74,76,78,80,82,86,90,92,88,78,65,52,44];
const own=[0,0,0,0,0,1,3,6,9,11,13,15,16,15,13,10,6,2,0,0,0,0,0,0];
const contracted=55;
const solar=[0,0,0,0,0,0,3,8,15,22,28,32,35,35,32,26,18,8,0,0,0,0,0,0];
const wind=[20,20,18,18,18,16,15,14,15,17,18,19,20,21,22,23,25,28,30,29,28,26,24,22];
const battery={7:20,8:20,9:20,17:20,18:20,19:20,20:20,21:20};
const prices={solar:520,wind:690,battery:{7:850,8:900,9:900,17:980,18:1050,19:1100,20:1080,21:1000}};
const nf=new Intl.NumberFormat('en-ZA',{maximumFractionDigits:1});
const zar=v=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(v);
const pos=h=>Math.max(demand[h-1]-contracted-own[h-1],0);
const secured=h=>Math.min(demand[h-1],contracted+own[h-1]);
const limit=h=>h>=17&&h<=21?1150:h>=7&&h<=10?1050:950;

function offers(h){
  const a=[];
  if(solar[h-1]>0)a.push({name:'Solar Farm A',tech:'Solar',vol:solar[h-1],price:prices.solar});
  if(wind[h-1]>0)a.push({name:'Wind Farm B',tech:'Wind',vol:wind[h-1],price:prices.wind});
  if(battery[h])a.push({name:'Battery Operator C',tech:'Battery',vol:battery[h],price:prices.battery[h]});
  return a.sort((a,b)=>a.price-b.price);
}

function clearMarket(h){
  const need=pos(h);
  let remaining=need;
  let accepted=[];
  let mcp=null;
  for(const o of offers(h).filter(x=>x.price<=limit(h))){
    if(remaining<=0)break;
    const q=Math.min(remaining,o.vol);
    accepted.push({...o,accepted:q});
    remaining-=q;
    mcp=o.price;
  }
  const acceptedVol=need-remaining;
  return {need,acceptedVol,mcp,status:acceptedVol===0?'UNCLEARED':acceptedVol<need?'PARTIAL':'CLEARED',accepted};
}

function renderSummary(){
  const totalDemand=demand.reduce((a,b)=>a+b,0);
  const totalOpen=Array.from({length:24},(_,i)=>pos(i+1)).reduce((a,b)=>a+b,0);
  const securedEnergy=totalDemand-totalOpen;
  const coverage=securedEnergy/totalDemand*100;
  const shortHours=Array.from({length:24},(_,i)=>pos(i+1)>0).filter(Boolean).length;
  let spend=0;
  for(let h=1;h<=24;h++){
    const r=clearMarket(h);
    if(r.mcp)spend+=r.acceptedVol*r.mcp;
  }
  document.querySelector('#totalDemand').textContent=`${nf.format(totalDemand)} MWh`;
  document.querySelector('#coveragePct').textContent=`${nf.format(coverage)}%`;
  document.querySelector('#totalOpen').textContent=`${nf.format(totalOpen)} MWh`;
  document.querySelector('#estimatedSpend').textContent=zar(spend);
  document.querySelector('#shortHours').textContent=shortHours;
}

function renderChart(){
  const host=document.querySelector('#positionChart');
  const W=900,H=280,pad={l:36,r:12,t:12,b:26};
  const maxY=Math.ceil(Math.max(...demand)/10)*10;
  const x=i=>pad.l+i*(W-pad.l-pad.r)/23;
  const y=v=>pad.t+(maxY-v)*(H-pad.t-pad.b)/maxY;
  const line=arr=>arr.map((v,i)=>`${i?'L':'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const openArr=Array.from({length:24},(_,i)=>pos(i+1));
  const securedArr=Array.from({length:24},(_,i)=>secured(i+1));
  const area=(arr)=>`${line(arr)} L ${x(23)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  let grid='';
  for(let v=0;v<=maxY;v+=20){grid+=`<line class="axis" x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}"></line><text class="label" x="2" y="${y(v)+3}">${v}</text>`;}
  let labels='';
  [1,4,7,10,13,16,19,22,24].forEach(h=>labels+=`<text class="label" text-anchor="middle" x="${x(h-1)}" y="${H-5}">${String(h).padStart(2,'0')}</text>`);
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hourly energy position chart">${grid}<path class="area-demand" d="${area(demand)}"></path><path class="area-open" d="${area(openArr)}"></path><path class="line-demand" d="${line(demand)}"></path><path class="line-cover" d="${line(securedArr)}"></path><path class="line-open" d="${line(openArr)}"></path>${labels}</svg>`;
}

function renderTable(){
  const body=document.querySelector('#positionTable');
  body.innerHTML='';
  for(let h=1;h<=24;h++){
    const p=pos(h);
    body.insertAdjacentHTML('beforeend',`<tr><td>HE ${String(h).padStart(2,'0')}</td><td>${nf.format(demand[h-1])} MWh</td><td>${contracted} MWh</td><td>${nf.format(own[h-1])} MWh</td><td>${nf.format(p)} MWh</td><td class="${p>0?'status-short':'status-covered'}">${p>0?'SHORT':'COVERED'}</td></tr>`);
  }
}

function renderHour(h){
  document.querySelector('#selectedHourLabel').textContent=`Hour ending ${String(h).padStart(2,'0')}:00`;
  document.querySelector('#demand').textContent=`${nf.format(demand[h-1])} MWh`;
  document.querySelector('#contracted').textContent=`${contracted} MWh`;
  document.querySelector('#ownGen').textContent=`${nf.format(own[h-1])} MWh`;
  const p=pos(h);
  document.querySelector('#openPosition').textContent=`${nf.format(p)} MWh`;
  const pill=document.querySelector('#statusPill');
  pill.className=`pill ${p>0?'short':'covered'}`;
  pill.textContent=p>0?'SHORT':'COVERED';
  const d=document.querySelector('#decision');
  d.className=`decision ${p>0?'short':'covered'}`;
  d.textContent=p>0?`Action required: procure ${nf.format(p)} MWh for this trading period.`:'No additional market purchase is required for this trading period.';

  const stack=document.querySelector('#sellerStack');
  const os=offers(h);
  stack.innerHTML=os.length?os.map(o=>`<div class="offer"><div><strong>${o.name}</strong><br><small>${o.tech}</small></div><div>${nf.format(o.vol)} MWh</div><div class="price">${zar(o.price)}/MWh</div></div>`).join(''):'<div class="empty-state">No simulated seller offers for this hour.</div>';

  const bid=document.querySelector('#bidCard');
  if(p>0){
    bid.innerHTML=`<div class="bid-box"><small>Recommended BUY volume</small><div class="big">${nf.format(p)} MWh</div><div class="bid-details"><div><small>Trading period</small><br><strong>HE ${String(h).padStart(2,'0')}</strong></div><div><small>Max bid price</small><br><strong>${zar(limit(h))}/MWh</strong></div></div></div>`;
    document.querySelector('#clearBtn').disabled=false;
  }else{
    bid.innerHTML='<div class="empty-state"><strong>No bid required.</strong><br>The customer is already commercially covered.</div>';
    document.querySelector('#clearBtn').disabled=true;
  }
  document.querySelector('#result').innerHTML='<div class="empty-state">Run the clearing simulation to populate the result.</div>';
}

function renderResult(h){
  const r=clearMarket(h);
  const cls=r.status==='CLEARED'?'result-ok':r.status==='PARTIAL'?'result-partial':'result-none';
  const cost=r.mcp?r.acceptedVol*r.mcp:0;
  const accepted=r.accepted.length?`<div class="accepted-list"><strong>Matched supply</strong><br>${r.accepted.map(a=>`${a.name}: ${nf.format(a.accepted)} MWh @ ${zar(a.price)}`).join('<br>')}</div>`:'';
  document.querySelector('#result').innerHTML=`<div class="${cls}"><strong>${r.status}</strong><div class="result-grid"><div><small>Requested</small><br><strong>${nf.format(r.need)} MWh</strong></div><div><small>Accepted</small><br><strong>${nf.format(r.acceptedVol)} MWh</strong></div><div><small>Simulated MCP</small><br><strong>${r.mcp?zar(r.mcp)+'/MWh':'—'}</strong></div><div><small>Market cost</small><br><strong>${r.mcp?zar(cost):'—'}</strong></div></div>${r.status==='PARTIAL'?`<p><strong>${nf.format(r.need-r.acceptedVol)} MWh remains uncovered.</strong></p>`:''}${accepted}</div>`;
  document.querySelector('#scheduledInput').value=r.acceptedVol||r.need||0;
}

function reconcile(){
  const scheduled=Number(document.querySelector('#scheduledInput').value)||0;
  const actual=Number(document.querySelector('#actualInput').value)||0;
  const price=Number(document.querySelector('#imbalancePriceInput').value)||0;
  const imbalance=actual-scheduled;
  const cost=Math.abs(imbalance)*price;
  const direction=imbalance>0?'Over-consumed':imbalance<0?'Under-consumed':'Balanced';
  document.querySelector('#reconciliationResult').innerHTML=`<div class="settlement-card"><span>Scheduled</span><strong>${nf.format(scheduled)} MWh</strong></div><div class="settlement-card"><span>Actual</span><strong>${nf.format(actual)} MWh</strong></div><div class="settlement-card alert"><span>Imbalance</span><strong>${nf.format(imbalance)} MWh</strong><small>${direction}</small></div><div class="settlement-card alert"><span>Illustrative exposure</span><strong>${zar(cost)}</strong><small>At ${zar(price)}/MWh</small></div>`;
}

const sel=document.querySelector('#hourSelect');
for(let h=1;h<=24;h++)sel.insertAdjacentHTML('beforeend',`<option value="${h}" ${h===18?'selected':''}>HE ${String(h).padStart(2,'0')}</option>`);
renderSummary();
renderChart();
renderTable();
renderHour(18);
reconcile();
sel.addEventListener('change',e=>renderHour(Number(e.target.value)));
document.querySelector('#clearBtn').addEventListener('click',()=>renderResult(Number(sel.value)));
document.querySelector('#reconcileBtn').addEventListener('click',reconcile);