const demand=[38,37,36,36,38,42,50,58,65,70,72,74,76,78,80,82,86,90,92,88,78,65,52,44];
const own=[0,0,0,0,0,1,3,6,9,11,13,15,16,15,13,10,6,2,0,0,0,0,0,0];
const contracted=55;
const nf=new Intl.NumberFormat('en-ZA',{maximumFractionDigits:1});
const zar=v=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(v);
const pos=h=>Math.max(demand[h-1]-contracted-own[h-1],0);

function switchView(view,{updateHash=true}={}){
  const valid=['dashboard','portfolio','market','settlement','risk'];
  if(!valid.includes(view)) view='dashboard';

  document.querySelectorAll('.app-view').forEach(el=>{
    el.classList.toggle('active',el.id===`view-${view}`);
  });

  document.querySelectorAll('.nav-tab').forEach(btn=>{
    const active=btn.dataset.view===view;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',active?'true':'false');
  });

  if(updateHash){
    history.replaceState(null,'',`#${view}`);
  }

  window.scrollTo({top:0,behavior:'smooth'});
}

function initNavigation(){
  document.querySelectorAll('.nav-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      switchView(btn.dataset.view);
    });
  });

  const initial=(location.hash||'#dashboard').replace('#','');
  switchView(initial,{updateHash:false});

  window.addEventListener('hashchange',()=>{
    switchView((location.hash||'#dashboard').replace('#',''),{updateHash:false});
  });
}

function renderHourBars(){
  const host=document.querySelector('#hourBars');
  if(!host) return;

  const maxDemand=Math.max(...demand);
  host.innerHTML='';

  for(let h=1;h<=24;h++){
    const open=pos(h);
    const covered=Math.max(demand[h-1]-open,0);
    const coveredPct=(covered/maxDemand)*100;
    const openPct=(open/maxDemand)*100;

    host.insertAdjacentHTML('beforeend',`
      <div class="hour-col" title="HE${String(h).padStart(2,'0')}: Demand ${demand[h-1]} MWh · Open ${open} MWh">
        <div class="bar-stack">
          <i class="bar-cover" style="height:${coveredPct}%"></i>
          <i class="bar-open" style="height:${openPct}%"></i>
        </div>
        <span>${String(h).padStart(2,'0')}</span>
      </div>`);
  }
}

function renderBidRows(){
  const body=document.querySelector('#bidRows');
  if(!body) return;

  body.innerHTML='';
  const hours=[8,9,10,11,12,13,14,15,16,17,18,19,20,21];

  hours.forEach(h=>{
    const volume=pos(h);
    const cap=h>=17&&h<=21?1150:h<=10?1050:950;
    const workflow=(h===19||h===20)?'Needs review':'Ready';
    const result=h<=18?'Mock cleared':'Pending';

    body.insertAdjacentHTML('beforeend',`
      <tr>
        <td>HE${String(h).padStart(2,'0')}</td>
        <td>${nf.format(volume)} MWh short</td>
        <td>${nf.format(volume)} MWh BUY</td>
        <td>${zar(cap)}/MWh</td>
        <td><span class="status-chip ${workflow==='Ready'?'good':'warn'}">${workflow}</span></td>
        <td><span class="status-chip ${result==='Mock cleared'?'good':'neutral'}">${result}</span></td>
      </tr>`);
  });
}

function initMarketActions(){
  const approve=document.querySelector('#approveBid');
  if(approve){
    approve.addEventListener('click',()=>{
      approve.textContent='Approved ✓';
      approve.classList.add('approved');
      approve.disabled=true;
    });
  }
}

function initContractAction(){
  const addButton=document.querySelector('#view-portfolio .mini-button');
  if(!addButton) return;

  addButton.addEventListener('click',()=>{
    const original=addButton.textContent;
    addButton.textContent='Contract workflow preview';
    setTimeout(()=>{ addButton.textContent=original; },1600);
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initNavigation();
  renderHourBars();
  renderBidRows();
  initMarketActions();
  initContractAction();
});