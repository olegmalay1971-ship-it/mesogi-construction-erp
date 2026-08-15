const VAT=0.19;
const STORAGE_KEY='mesogi-v083-build043';
const legacyKeys=['mesogi-v082-build04','mesogi-v08-build04','mesogi-v07'];
const unitList=['м²','м³','м.п.','шт','комплект','точка','день','час','рейс','тонна','кг','мешок','литр'];
const initialLibrary={
 workCategories:[
  {id:'WC_DEM',name:'Демонтажные работы',active:true},
  {id:'WC_GEN',name:'Общестроительные работы',active:true},
  {id:'WC_ELEC',name:'Электромонтажные работы',active:true},
  {id:'WC_PLUMB',name:'Сантехнические работы',active:true},
  {id:'WC_FIN',name:'Отделочные работы',active:true},
  {id:'WC_OPEN',name:'Окна и двери',active:true},
  {id:'WC_ADD',name:'Дополнительные работы',active:true},
  {id:'WC_OVER',name:'Накладные расходы',active:true}
 ],
 works:[
  {id:'W1',categoryId:'WC_DEM',name:'Демонтаж плитки',unit:'м²',cost:10,sell:15,active:true,recommendedMaterialIds:[]},
  {id:'W2',categoryId:'WC_DEM',name:'Демонтаж стяжки',unit:'м²',cost:10,sell:15,active:true,recommendedMaterialIds:[]},
  {id:'W3',categoryId:'WC_GEN',name:'Кладка перегородки из блока',unit:'м²',cost:20,sell:28,active:true,recommendedMaterialIds:['M4']},
  {id:'W4',categoryId:'WC_GEN',name:'Монтаж перегородки ГКЛ',unit:'м²',cost:60,sell:80,active:true,recommendedMaterialIds:[]},
  {id:'W5',categoryId:'WC_GEN',name:'Устройство цементной стяжки',unit:'м²',cost:16,sell:22,active:true,recommendedMaterialIds:['M2']},
  {id:'W6',categoryId:'WC_GEN',name:'Нанесение цементной гидроизоляции',unit:'м²',cost:10,sell:14,active:true,recommendedMaterialIds:['M3']},
  {id:'W7',categoryId:'WC_GEN',name:'Кровельные работы',unit:'м²',cost:0,sell:0,active:true,recommendedMaterialIds:[]},
  {id:'W8',categoryId:'WC_ELEC',name:'Монтаж электроточки',unit:'точка',cost:55,sell:75,active:true,recommendedMaterialIds:[]},
  {id:'W9',categoryId:'WC_PLUMB',name:'Монтаж унитаза',unit:'шт',cost:0,sell:0,active:true,recommendedMaterialIds:[]},
  {id:'W10',categoryId:'WC_FIN',name:'Укладка плитки',unit:'м²',cost:28,sell:40,active:true,recommendedMaterialIds:['M6']},
  {id:'W11',categoryId:'WC_FIN',name:'Штукатурка стен',unit:'м²',cost:13,sell:18,active:true,recommendedMaterialIds:['M5']},
  {id:'W12',categoryId:'WC_FIN',name:'Покраска стен',unit:'м²',cost:8,sell:12,active:true,recommendedMaterialIds:['M7']},
  {id:'W13',categoryId:'WC_OPEN',name:'Установка двери',unit:'шт',cost:0,sell:0,active:true,recommendedMaterialIds:[]},
  {id:'W14',categoryId:'WC_ADD',name:'Дополнительная работа',unit:'комплект',cost:0,sell:0,active:true,recommendedMaterialIds:[]},
  {id:'W15',categoryId:'WC_OVER',name:'SKIP / контейнер',unit:'рейс',cost:210,sell:210,active:true,recommendedMaterialIds:[]},
  {id:'W16',categoryId:'WC_OVER',name:'Доставка',unit:'рейс',cost:0,sell:0,active:true,recommendedMaterialIds:[]},
  {id:'W17',categoryId:'WC_OVER',name:'Аренда оборудования',unit:'день',cost:0,sell:0,active:true,recommendedMaterialIds:[]},
  {id:'W18',categoryId:'WC_OVER',name:'Биотуалет',unit:'месяц',cost:0,sell:0,active:true,recommendedMaterialIds:[]}
 ],
 suppliers:[{id:'S1',name:'House of Materials'},{id:'S2',name:'Local Supplier Paphos'},{id:'S3',name:'Roma House'}],
 materials:[
  {id:'M1',category:'Грунтовки',manufacturer:'Mapei',name:'Primer G',unit:'литр',buyInc:6.50,supplierId:'S1',effectiveDate:'2026-07-01',active:true},
  {id:'M2',category:'Стяжки',manufacturer:'Mapei',name:'Topcem Pronto',unit:'мешок',buyInc:14.90,supplierId:'S1',effectiveDate:'2026-07-01',active:true},
  {id:'M3',category:'Гидроизоляция',manufacturer:'Sika',name:'Sikalastic-152',unit:'комплект',buyInc:54.00,supplierId:'S2',effectiveDate:'2026-07-01',active:true},
  {id:'M4',category:'Кладочные смеси',manufacturer:'Marmoline',name:'Mortar 330',unit:'мешок',buyInc:8.80,supplierId:'S2',effectiveDate:'2026-07-01',active:true},
  {id:'M5',category:'Штукатурки',manufacturer:'Knauf',name:'MP 75',unit:'мешок',buyInc:11.90,supplierId:'S3',effectiveDate:'2026-07-01',active:true},
  {id:'M6',category:'Клеи',manufacturer:'Kerakoll',name:'H40',unit:'мешок',buyInc:17.50,supplierId:'S1',effectiveDate:'2026-07-01',active:true},
  {id:'M7',category:'Краски',manufacturer:'Vivechrom',name:'Interior Emulsion',unit:'литр',buyInc:7.20,supplierId:'S2',effectiveDate:'2026-07-01',active:true}
 ]
};
let state={project:{company:'ESTUDIO MISOGI',name:'Tala Villa',client:'Новый клиент',address:'Tala, Paphos',estimateNo:'EST-2026-015',defaultMargin:25},sections:[],library:structuredClone(initialLibrary)};
let activeSection=null,editingWorkId=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0)+' €';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const byId=(arr,id)=>arr.find(x=>x.id===id);
const categoryName=id=>byId(state.library.workCategories,id)?.name||'';
const supplierName=id=>byId(state.library.suppliers,id)?.name||'';
function openModal(id){$('#'+id).classList.add('open')}
function closeModals(){$$('.modal').forEach(x=>x.classList.remove('open'))}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1700)}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function migrateWork(w){
 const buyInc=Number(w.buyIncSnapshot??w.buyInc??0); const matMargin=Number(w.materialMarginSnapshot??w.materialMargin??0);
 const sellInc=Number(w.materialSellIncSnapshot??w.materialSellInc??(buyInc*(1+matMargin/100)));
 return {...w,
  name:w.nameSnapshot||w.name||'', unit:w.unitSnapshot||w.unit||'м²', qty:Number(w.qty||0),
  workCost:Number(w.workCostSnapshot??w.workCost??0), workMargin:Number(w.workMarginSnapshot??w.workMargin??0),
  workSell:Number(w.workSellSnapshot??w.workSell??0), materialName:w.materialNameSnapshot||w.materialName||'',
  materialQty:Number(w.materialQty||0),materialUnit:w.materialUnitSnapshot||w.materialUnit||'шт',
  buyInc,materialMargin:matMargin,materialSellInc:sellInc,comment:w.comment||''
 };
}
function normalizeSections(){
 const standard=new Set(['Демонтажные работы','Общестроительные работы','Электромонтажные работы','Сантехнические работы','Отделочные работы','Окна и двери','Дополнительные работы','Накладные расходы']);
 const result=[]; const seen=new Map();
 for(const sec of state.sections||[]){
  const name=String(sec.name||'').trim(); if(!name)continue;
  const key=name.toLowerCase();
  if(standard.has(name)&&seen.has(key)){
   const target=seen.get(key); target.works.push(...(sec.works||[])); target.open=target.open||sec.open;
  }else{
   const clean={...sec,name,works:sec.works||[]}; result.push(clean); seen.set(key,clean);
  }
 }
 state.sections=result;
}
function restore(){
 for(const key of [STORAGE_KEY,...legacyKeys]){try{const s=JSON.parse(localStorage.getItem(key));if(!s)continue;
  if(s.sections){state.sections=(s.sections||[]).map(sec=>({...sec,works:(sec.works||[]).map(migrateWork)}));}
  if(s.project)state.project={...state.project,...s.project};
  if(s.library?.works)state.library=structuredClone(initialLibrary);
  if(Array.isArray(s.overhead)&&s.overhead.length){let sec=state.sections.find(x=>x.name==='Накладные расходы');if(!sec){sec={id:uid(),name:'Накладные расходы',open:true,works:[]};state.sections.push(sec)}s.overhead.forEach(x=>sec.works.push(migrateWork({id:x.id||uid(),name:x.name,unit:'комплект',qty:1,workCost:x.amount,workMargin:0,workSell:x.amount})))}
  normalizeSections(); persist(); break;
 }catch(e){}}
}
function calcWork(w){const q=+w.qty||0;const workClient=(+w.workSell||0)*q;const matClient=(+w.materialSellInc||0)*(+w.materialQty||0);const cost=(+w.workCost||0)*q+(+w.buyInc||0)*(+w.materialQty||0);return{workClient,matClient,total:workClient+matClient,cost}}
function totals(){let t={work:0,materials:0,cost:0};state.sections.forEach(s=>s.works.forEach(w=>{const c=calcWork(w);t.work+=c.workClient;t.materials+=c.matClient;t.cost+=c.cost}));t.total=t.work+t.materials;t.profit=t.total-t.cost;t.margin=t.total?100*t.profit/t.total:0;t.vat=t.materials*VAT/(1+VAT);return t}
function updateProjectHeader(){ $('#projectTitle').textContent=state.project.name; $('#projectMeta').textContent=`${state.project.estimateNo} · ${state.project.client} · ${state.project.address}` }
function recalc(){const t=totals();$('#sumWork').textContent=money(t.work);$('#sumMaterials').textContent=money(t.materials);$('#sumProfit').textContent=money(t.profit);$('#sumMargin').textContent=`Фактическая маржа ${t.margin.toFixed(1)}%`;$('#sumTotal').textContent=money(t.total);$('#sumVat').textContent=`В том числе НДС по материалам ${money(t.vat)}`;renderMaterials();persist()}
function render(){updateProjectHeader();const box=$('#estimateList');box.innerHTML='';$('#emptyState').classList.toggle('hidden',state.sections.length>0);$('#sectionCount').textContent=`${state.sections.length} ${state.sections.length===1?'раздел':'разделов'}`;state.sections.forEach((s,idx)=>{const st=s.works.reduce((a,w)=>a+calcWork(w).total,0);const el=document.createElement('section');el.className='section '+(s.open?'open':'');el.dataset.id=s.id;el.innerHTML=`<div class="section-head"><button class="section-toggle">›</button><div class="section-name">${s.name}</div><div class="section-total">${money(st)}</div><button class="section-actions" title="Удалить раздел">×</button></div><div class="section-body"><div class="work-row header"><div>Наименование</div><div>Кол-во</div><div>Ед.</div><div>Работа / ед.</div><div>Материалы</div><div>Итого</div><div></div></div><div class="rows"></div><div class="add-work-row"><button>+ Добавить работу</button></div></div>`;const rows=el.querySelector('.rows');s.works.forEach(w=>{const c=calcWork(w);const r=document.createElement('div');r.className='work-row editable';r.dataset.id=w.id;r.title='Нажмите, чтобы открыть и изменить работу';r.innerHTML=`<div class="work-name"><b>${w.name}</b>${w.materialName?`<small>${w.materialName}: ${w.materialQty} ${w.materialUnit}</small>`:'<small>Нажмите строку для редактирования</small>'}${w.comment?`<small>${w.comment}</small>`:''}</div><div>${w.qty}</div><div>${w.unit}</div><div class="money">${money(w.workSell)}</div><div class="money">${money(c.matClient)}</div><div class="money">${money(c.total)}</div><button class="delete" title="Удалить">×</button>`;r.onclick=e=>{if(e.target.classList.contains('delete'))return;showWork(s.id,w.id)};r.querySelector('.delete').onclick=e=>{e.stopPropagation();s.works=s.works.filter(x=>x.id!==w.id);render()};rows.appendChild(r)});el.querySelector('.section-toggle').onclick=()=>{s.open=!s.open;render()};el.querySelector('.section-actions').onclick=()=>{if(confirm('Удалить раздел и все его работы?')){state.sections=state.sections.filter(x=>x.id!==s.id);render()}};el.querySelector('.add-work-row button').onclick=()=>showWork(s.id);box.appendChild(el)});recalc()}
function renderMaterials(){const body=$('#materialsBody');body.innerHTML='';const mats=[];state.sections.forEach(s=>s.works.forEach(w=>{if(w.materialName&&w.materialQty>0)mats.push(w)}));$('#materialsEmpty').classList.toggle('hidden',mats.length>0);mats.forEach(w=>{const total=(+w.materialSellInc||0)*(+w.materialQty||0);const tr=document.createElement('tr');tr.innerHTML=`<td>${w.materialName}</td><td>${w.materialQty}</td><td>${w.materialUnit}</td><td>${money(w.buyInc)}</td><td>${Number(w.materialMargin||0).toFixed(1)}%</td><td>${money(w.materialSellInc)}</td><td>${money(total)}</td>`;body.appendChild(tr)})}
function sectionCategoryId(name){return state.library.workCategories.find(c=>c.name===name)?.id||''}
function populateMaterials(){const sel=$('#materialLibrarySelect');sel.innerHTML='<option value="">Без материала</option>'+state.library.materials.filter(x=>x.active).map(m=>`<option value="${m.id}">${m.manufacturer} ${m.name}</option>`).join('')}
function renderCatalog(){const q=$('#workSearch').value.toLowerCase();const section=state.sections.find(x=>x.id===activeSection);const catId=sectionCategoryId(section?.name||'');const box=$('#workCatalog');box.innerHTML='';state.library.works.filter(w=>w.active&&(!catId||w.categoryId===catId)&&w.name.toLowerCase().includes(q)).forEach(w=>{const b=document.createElement('button');b.type='button';b.className='catalog-item';b.innerHTML=`<span>${w.name}</span><span>${money(w.sell)}/${w.unit}</span>`;b.onclick=()=>selectLibraryWork(w);box.appendChild(b)});if(!box.children.length)box.innerHTML='<div class="empty small-empty">В этом разделе пока нет подходящих работ. Используйте «Вручную».</div>'}
function showWork(sectionId,workId=null){activeSection=sectionId;editingWorkId=workId;const s=state.sections.find(x=>x.id===sectionId);resetWork();$('#workSectionId').value=sectionId;$('#workSectionName').textContent=s.name;$('#workModalTitle').textContent=workId?'Редактировать работу':'Добавить работу';$('#workSubmitBtn').textContent=workId?'Сохранить изменения':'Добавить работу';renderCatalog();populateMaterials();if(workId)fillFormFromWork(s.works.find(x=>x.id===workId));openModal('workModal')}
function selectLibraryWork(w){$('#workForm').dataset.workId=w.id;$('#workName').value=w.name;$('#workUnit').value=w.unit;$('#workCost').value=w.cost;$('#workSell').value=w.sell;$('#workMargin').value=w.cost?((w.sell/w.cost-1)*100).toFixed(2):0;const recommended=w.recommendedMaterialIds?.[0];if(recommended){$('#materialLibrarySelect').value=recommended;selectLibraryMaterial(byId(state.library.materials,recommended))}}
function selectLibraryMaterial(m){if(!m)return;$('#workForm').dataset.materialId=m.id;$('#materialUnit').value=m.unit;$('#buyInc').value=m.buyInc;syncMaterial()}
function resetWork(){$('#workForm').reset();delete $('#workForm').dataset.workId;delete $('#workForm').dataset.materialId;$('#workQty').value=1;$('#workMargin').value=state.project.defaultMargin||25;$('#materialMargin').value=0;$('#workSell').value=0;$('#sellInc').value=0;$('#workSearch').value=''}
function fillFormFromWork(w){if(!w)return;$('#workName').value=w.name||'';$('#workUnit').value=w.unit||'м²';$('#workQty').value=w.qty||0;$('#workCost').value=w.workCost||0;$('#workMargin').value=w.workMargin||0;$('#workSell').value=w.workSell||0;$('#materialQty').value=w.materialQty||0;$('#materialUnit').value=w.materialUnit||'шт';$('#buyInc').value=w.buyInc||0;$('#materialMargin').value=w.materialMargin||0;$('#sellInc').value=w.materialSellInc||0;$('#workComment').value=w.comment||'';if(w.workId)$('#workForm').dataset.workId=w.workId;if(w.materialId){$('#workForm').dataset.materialId=w.materialId;$('#materialLibrarySelect').value=w.materialId}}
function syncMaterial(){const inc=+$('#buyInc').value||0,m=+$('#materialMargin').value||0;$('#sellInc').value=(inc*(1+m/100)).toFixed(2)}
function renderWorksLibrary(filter=''){const body=$('#worksLibraryBody');body.innerHTML='';const q=filter.toLowerCase();state.library.works.filter(x=>x.name.toLowerCase().includes(q)).forEach(w=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${categoryName(w.categoryId)}</td><td>${w.name}</td><td>${w.unit}</td><td>${money(w.sell)}</td><td><span class="status-pill ${w.active?'':'off'}">${w.active?'Активна':'Неактивна'}</span></td>`;body.appendChild(tr)})}
function renderMaterialsLibrary(filter=''){const body=$('#materialsLibraryBody');body.innerHTML='';const q=filter.toLowerCase();state.library.materials.filter(x=>(x.name+' '+x.manufacturer).toLowerCase().includes(q)).forEach(m=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${m.category}</td><td>${m.manufacturer} ${m.name}</td><td>${m.unit}</td><td>${money(m.buyInc)}</td><td>${supplierName(m.supplierId)}</td><td>${m.effectiveDate}</td><td><span class="status-pill ${m.active?'':'off'}">${m.active?'Активен':'Неактивен'}</span></td>`;body.appendChild(tr)})}
function addLibraryWork(){const name=prompt('Название работы');if(!name)return;const sectionName=prompt('Раздел сметы','Общестроительные работы')||'Общестроительные работы';const cat=state.library.workCategories.find(x=>x.name===sectionName)||state.library.workCategories[1];state.library.works.push({id:uid(),categoryId:cat.id,name,unit:'м²',cost:0,sell:0,active:true,recommendedMaterialIds:[]});persist();renderWorksLibrary($('#worksLibrarySearch').value);toast('Работа добавлена в справочник')}
function addLibraryMaterial(){const name=prompt('Название материала');if(!name)return;state.library.materials.push({id:uid(),category:'Прочие материалы',manufacturer:'',name,unit:'шт',buyInc:0,supplierId:state.library.suppliers[0].id,effectiveDate:new Date().toISOString().slice(0,10),active:true});persist();renderMaterialsLibrary($('#materialsLibrarySearch').value);toast('Материал добавлен в справочник')}
$('#addSectionBtn').onclick=()=>{renderSectionOptions();openModal('sectionModal')};$('#projectBtn').onclick=()=>{$('#projectCompany').value=state.project.company;$('#projectName').value=state.project.name;$('#projectClient').value=state.project.client;$('#projectAddress').value=state.project.address;$('#projectMargin').value=state.project.defaultMargin;openModal('projectModal')};$('#saveBtn').onclick=()=>{persist();toast('Смета сохранена в браузере')};$$('[data-close]').forEach(b=>b.onclick=closeModals);$$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)closeModals()});
const sectionCategories=['Демонтажные работы','Общестроительные работы','Электромонтажные работы','Сантехнические работы','Отделочные работы','Окна и двери','Дополнительные работы','Накладные расходы'];
function renderSectionOptions(){const box=$('#sectionOptions');box.innerHTML='';const used=new Set(state.sections.map(s=>s.name));sectionCategories.filter(name=>!used.has(name)).forEach(name=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{const sec={id:uid(),name,open:true,works:[]};state.sections.push(sec);persist();closeModals();render();showWork(sec.id)};box.appendChild(b)});const custom=document.createElement('button');custom.textContent='Новый раздел вручную';custom.onclick=()=>{const name=(prompt('Название раздела')||'').trim();if(!name)return;if(state.sections.some(s=>s.name.toLowerCase()===name.toLowerCase())){toast('Такой раздел уже добавлен');return}state.sections.push({id:uid(),name,open:true,works:[]});persist();closeModals();render()};box.appendChild(custom)};
$('#manualWorkBtn').onclick=()=>{$('#workForm').dataset.workId='';$('#workName').value='';$('#workName').focus()};$('#workSearch').oninput=renderCatalog;$('#materialLibrarySelect').onchange=()=>{const m=byId(state.library.materials,$('#materialLibrarySelect').value);if(m)selectLibraryMaterial(m);else{delete $('#workForm').dataset.materialId;$('#materialQty').value=0;$('#buyInc').value=0;$('#sellInc').value=0}};
$('#workCost').oninput=()=>{const c=+$('#workCost').value||0,m=+$('#workMargin').value||0;$('#workSell').value=(c*(1+m/100)).toFixed(2)};$('#workMargin').oninput=$('#workCost').oninput;$('#buyInc').oninput=syncMaterial;$('#materialMargin').oninput=syncMaterial;
$('#workForm').onsubmit=e=>{e.preventDefault();const s=state.sections.find(x=>x.id===$('#workSectionId').value);if(!s)return;const selectedWork=byId(state.library.works,$('#workForm').dataset.workId);const selectedMat=byId(state.library.materials,$('#workForm').dataset.materialId);const existing=editingWorkId?s.works.find(x=>x.id===editingWorkId):null;const w={id:existing?.id||uid(),workId:selectedWork?.id||existing?.workId||null,name:$('#workName').value.trim(),unit:$('#workUnit').value,qty:+$('#workQty').value||0,workCost:+$('#workCost').value||0,workMargin:+$('#workMargin').value||0,workSell:+$('#workSell').value||0,materialId:selectedMat?.id||null,materialName:selectedMat?`${selectedMat.manufacturer} ${selectedMat.name}`:'',materialQty:+$('#materialQty').value||0,materialUnit:$('#materialUnit').value,buyInc:+$('#buyInc').value||0,materialMargin:+$('#materialMargin').value||0,materialSellInc:+$('#sellInc').value||0,comment:$('#workComment').value.trim(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(!w.name)return;if(existing)Object.assign(existing,w);else s.works.push(w);s.open=true;editingWorkId=null;closeModals();render();toast(existing?'Работа изменена':'Работа добавлена')};
$('#projectForm').onsubmit=e=>{e.preventDefault();state.project.company=$('#projectCompany').value.trim();state.project.name=$('#projectName').value.trim();state.project.client=$('#projectClient').value.trim();state.project.address=$('#projectAddress').value.trim();state.project.defaultMargin=+$('#projectMargin').value||25;closeModals();render();toast('Объект обновлён')};
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');['estimate','materials'].forEach(t=>$('#'+t+'Tab').classList.toggle('hidden',b.dataset.tab!==t))});
$('#search').oninput=e=>{const q=e.target.value.toLowerCase();$$('.section').forEach(el=>{const s=state.sections.find(x=>x.id===el.dataset.id);el.style.display=(s.name.toLowerCase().includes(q)||s.works.some(w=>w.name.toLowerCase().includes(q)))?'':'none'})};
$('#menuBtn').onclick=()=>{$('#sidebar').classList.add('open');$('#overlay').classList.add('open')};$('#moreBtn').onclick=$('#menuBtn').onclick;$('#overlay').onclick=()=>{$('#sidebar').classList.remove('open');$('#overlay').classList.remove('open')};
$('#worksLibraryLink').onclick=e=>{e.preventDefault();renderWorksLibrary();openModal('worksLibraryModal')};$('#materialsLibraryLink').onclick=e=>{e.preventDefault();renderMaterialsLibrary();openModal('materialsLibraryModal')};$('#worksLibrarySearch').oninput=e=>renderWorksLibrary(e.target.value);$('#materialsLibrarySearch').oninput=e=>renderMaterialsLibrary(e.target.value);$('#addLibraryWorkBtn').onclick=addLibraryWork;$('#addLibraryMaterialBtn').onclick=addLibraryMaterial;
restore();render();