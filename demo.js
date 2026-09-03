const demand=[38,37,36,36,38,42,50,58,65,70,72,74,76,78,80,82,86,90,92,88,78,65,52,44];
const own=[0,0,0,0,0,1,3,6,9,11,13,15,16,15,13,10,6,2,0,0,0,0,0,0];
const contracted=55;
const nf=new Intl.NumberFormat('en-ZA',{maximumFractionDigits:1});
const zar=v=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(v);
const pos=h=>Math.max(demand[h-1]-contracted-own[h-1],0);
const bidCap=h=>h>=17&&h<=21?1150:h>=7&&h<=10?1050:950;

function activateView(name){
  document.querySelectorAll('.app-view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  history.replaceState(null,'',`#${name}`);
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('.nav-tab').forEach(btn=>btn.addEventListener('click',()=>activateView(btn.dataset.view)));
const initial=location.hash.replace('#','');
if(['dashboard','portfolio','market','settlement','risk'].includes(initial)) activateView(initial);

function renderBars(){
  const host=document.querySelector('#hourBars');
  if(!host)return;
  const max=Math.max(...demand);
  host.innerHTML=demand.map((d,i)=>{
    const h=i+1,p=pos(h),covered=d-p;
    return `<div class="hour-col" title="HE${String(h).padStart(2,'0')}: demand ${d} MWh, open ${p} MWh"><div class="bar-stack"><i class="bar-cover" style="height:${covered/max*100}%"></i><i class="bar-open" style="height:${p/max*100}%"></i></div><span>${String(h).padStart(2,'0')}</span></div>`;
  }).join('');
}

function renderBidRows(){
  const body=document.querySelector('#bidRows');
  if(!body)return;
  body.innerHTML='';
  for(let h=1;h<=24;h++){
    const p=pos(h);
    if(p<=0)continue;
    const workflow=(h===19||h===20)?'Review':'Ready';
    const result=h<=18?'Cleared':'Pending';
    body.insertAdjacentHTML('beforeend',`<tr><td>HE${String(h).padStart(2,'0')}</td><td>${nf.format(p)} MWh short</td><td>${nf.format(p)} MWh</td><td>${zar(bidCap(h))}/MWh</td><td><span class="status-chip ${workflow==='Ready'?'good':'warn'}">${workflow}</span></td><td><span class="status-chip ${result==='Cleared'?'good':'neutral'}">${result}</span></td></tr>`);
  }
}

const approve=document.querySelector('#approveBid');
if(approve){approve.addEventListener('click',()=>{approve.textContent='Mock bid approved ✓';approve.disabled=true;approve.classList.add('approved');});}

renderBars();
renderBidRows();