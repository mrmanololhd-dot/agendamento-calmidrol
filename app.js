// ===== DADOS =====
const SK = 'pedidos-calmidrol-v4';
let pedidos = [];
let delId = null;
let selKitVal = '3m_normal';
let selPagVal = 'avista';

const KITS = {
  '3m_normal':   { nome: 'Protocolo Inicial – 3 meses',   frascos: 3,  avista: 'R$ 329,00', parc: '12x de R$ 34,03' },
  '5m_normal':   { nome: 'Protocolo Médio – 5 meses',     frascos: 5,  avista: 'R$ 379,00', parc: '12x de R$ 39,20' },
  '7m_normal':   { nome: 'Protocolo Completo – 7 meses',  frascos: 7,  avista: 'R$ 449,00', parc: '12x de R$ 46,44' },
  'ultra_normal':{ nome: 'Protocolo Ultra – 10 meses',    frascos: 10, avista: 'R$ 539,00', parc: '12x de R$ 55,75' },
  '3m_desc':     { nome: 'Protocolo Inicial – 3 meses',   frascos: 3,  avista: 'R$ 309,02', parc: '12x de R$ 31,96' },
  '5m_desc':     { nome: 'Protocolo Médio – 5 meses',     frascos: 5,  avista: 'R$ 359,00', parc: '12x de R$ 37,13' },
  '7m_desc':     { nome: 'Protocolo Completo – 7 meses',  frascos: 7,  avista: 'R$ 429,00', parc: '12x de R$ 44,37' },
  'ultra_desc':  { nome: 'Protocolo Ultra – 10 meses',    frascos: 10, avista: 'R$ 519,00', parc: '12x de R$ 53,68' },
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.getElementById('f-cpf').addEventListener('input', function () {
    this.value = fmtCPF(this.value);
  });
  document.getElementById('f-tel').addEventListener('input', function () {
    this.value = fmtTel(this.value);
  });
  document.getElementById('f-uf').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });
});

// ===== STORAGE =====
function loadData() {
  try { pedidos = JSON.parse(localStorage.getItem(SK)) || []; } catch (e) { pedidos = []; }
  pedidos = pedidos.map(p => ({ ...p, termo: p.termo || 'pendente' }));
  badge();
  stats();
}
function saveData() {
  localStorage.setItem(SK, JSON.stringify(pedidos));
}

// ===== TABS =====
function switchTab(t) {
  document.querySelectorAll('.tab').forEach((el, i) =>
    el.classList.toggle('active', i === (t === 'novo' ? 0 : 1))
  );
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById('sec-' + t).classList.add('active');
  if (t === 'lista') render();
}

// ===== KIT & PAGAMENTO =====
function selKit(el, val) {
  document.querySelectorAll('.kit-card').forEach(k => {
    k.classList.remove('sel-normal', 'sel-desc');
  });
  selKitVal = val;
  el.classList.add(val.includes('_desc') ? 'sel-desc' : 'sel-normal');
}

function selPag(el, val) {
  document.querySelectorAll('.pag-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  selPagVal = val;
}

// ===== CEP =====
let cepTimer = null;

function onCEPInput(el) {
  el.value = fmtCEP(el.value);
  const digits = el.value.replace(/\D/g, '');
  if (digits.length === 8) {
    clearTimeout(cepTimer);
    cepTimer = setTimeout(buscarCEP, 600);
  }
}

async function buscarCEP() {
  const cepVal = document.getElementById('f-cep').value.replace(/\D/g, '');
  if (cepVal.length !== 8) {
    showToast('Digite um CEP válido com 8 dígitos', 'error');
    return;
  }
  const btn = document.getElementById('btn-cep');
  btn.disabled = true;
  btn.textContent = 'Buscando...';
  try {
    const r = await fetch('https://viacep.com.br/ws/' + cepVal + '/json/');
    const d = await r.json();
    if (!d.erro) {
      document.getElementById('f-rua').value = d.logradouro || '';
      document.getElementById('f-bairro').value = d.bairro || '';
      document.getElementById('f-cidade').value = d.localidade || '';
      document.getElementById('f-uf').value = (d.uf || '').toUpperCase();
      document.getElementById('f-num').focus();
      showToast('✅ Endereço preenchido automaticamente!');
    } else {
      showToast('CEP não encontrado.', 'error');
    }
  } catch (e) {
    showToast('Erro ao buscar CEP. Verifique sua conexão.', 'error');
  }
  btn.disabled = false;
  btn.textContent = 'Buscar';
}

// ===== SALVAR =====
function salvar() {
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) { showToast('Informe o nome do paciente', 'error'); return; }

  const p = {
    id: Date.now(),
    data:    document.getElementById('f-data').value,
    nome,
    cpf:     document.getElementById('f-cpf').value,
    tel:     document.getElementById('f-tel').value,
    email:   document.getElementById('f-email').value,
    cep:     document.getElementById('f-cep').value,
    rua:     document.getElementById('f-rua').value,
    num:     document.getElementById('f-num').value,
    comp:    document.getElementById('f-comp').value,
    bairro:  document.getElementById('f-bairro').value,
    cidade:  document.getElementById('f-cidade').value,
    uf:      document.getElementById('f-uf').value.toUpperCase(),
    kit:     selKitVal,
    pagamento: selPagVal,
    info:    document.getElementById('f-info').value,
    status:  document.getElementById('f-status').value,
    termo:   'pendente',
  };

  pedidos.unshift(p);
  saveData();
  badge();
  stats();
  clearForm();
  showToast('✅ Pedido salvo com sucesso!');
}

function clearForm() {
  ['f-data','f-nome','f-cpf','f-tel','f-email','f-cep','f-rua','f-num','f-comp','f-bairro','f-cidade','f-uf','f-info']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-status').value = 'agendar';
  document.querySelectorAll('.kit-card').forEach((k, i) => {
    k.classList.remove('sel-normal', 'sel-desc');
    if (i === 0) k.classList.add('sel-normal');
  });
  selKitVal = '3m_normal';
  document.querySelectorAll('.pag-btn').forEach((b, i) => b.classList.toggle('sel', i === 0));
  selPagVal = 'avista';
}

// ===== RENDER LISTA =====
function render() {
  const fn = (document.getElementById('fil-nome').value || '').toLowerCase();
  const fs = document.getElementById('fil-status').value;
  const fk = document.getElementById('fil-kit').value;
  const ft = document.getElementById('fil-termo').value;

  const list = pedidos.filter(p => {
    const mn = !fn || p.nome.toLowerCase().includes(fn) || (p.cpf || '').includes(fn);
    const ms = !fs || p.status === fs;
    const mk = !fk || p.kit === fk;
    const mt = !ft || (p.termo || 'pendente') === ft;
    return mn && ms && mk && mt;
  });

  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty-msg');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(p => {
    const endParts = [
      p.rua && p.num ? p.rua + ', ' + p.num : p.rua,
      p.comp,
      p.bairro,
      (p.cidade || '') + (p.uf ? ' – ' + p.uf : ''),
      p.cep ? 'CEP ' + p.cep : ''
    ].filter(Boolean);
    const end = endParts.join(' • ');
    const termo = p.termo || 'pendente';
    const pillClass = termo === 'confirmado' ? 'pill-conf' : 'pill-pend';
    const pillLabel = termo === 'confirmado' ? '✅ Confirmado' : '⏳ Pendente';

    return `<tr>
<td><input class="td-edit" value="${esc(p.data)}" style="min-width:100px" onchange="upd(${p.id},'data',this.value)"></td>
<td><input class="td-edit" value="${esc(p.nome)}" style="min-width:130px" onchange="upd(${p.id},'nome',this.value)"></td>
<td><input class="td-edit" value="${esc(p.tel)}" style="min-width:120px" onchange="upd(${p.id},'tel',this.value)"></td>
<td><input class="td-edit" value="${esc(p.email)}" style="min-width:150px" onchange="upd(${p.id},'email',this.value)"></td>
<td><input class="td-edit" value="${esc(p.cpf)}" style="min-width:120px" onchange="upd(${p.id},'cpf',this.value)"></td>
<td>
  <select class="kit-sel-td" onchange="upd(${p.id},'kit',this.value)">
    <optgroup label="Normal">
      <option value="3m_normal"    ${p.kit==='3m_normal'?'selected':''}>3 meses</option>
      <option value="5m_normal"    ${p.kit==='5m_normal'?'selected':''}>5 meses</option>
      <option value="7m_normal"    ${p.kit==='7m_normal'?'selected':''}>7 meses</option>
      <option value="ultra_normal" ${p.kit==='ultra_normal'?'selected':''}>Ultra</option>
    </optgroup>
    <optgroup label="Desconto 🏷">
      <option value="3m_desc"    ${p.kit==='3m_desc'?'selected':''}>3 meses</option>
      <option value="5m_desc"    ${p.kit==='5m_desc'?'selected':''}>5 meses</option>
      <option value="7m_desc"    ${p.kit==='7m_desc'?'selected':''}>7 meses</option>
      <option value="ultra_desc" ${p.kit==='ultra_desc'?'selected':''}>Ultra</option>
    </optgroup>
  </select>
</td>
<td>
  <select class="td-sel" onchange="upd(${p.id},'pagamento',this.value)">
    <option value="avista"    ${p.pagamento==='avista'?'selected':''}>À vista</option>
    <option value="parcelado" ${p.pagamento==='parcelado'?'selected':''}>12x</option>
    <option value="ambos"     ${p.pagamento==='ambos'?'selected':''}>Ambos</option>
  </select>
</td>
<td style="font-size:11px;max-width:170px;min-width:130px;word-break:break-word;line-height:1.6">${esc(end) || '—'}</td>
<td>
  <select class="td-sel" onchange="upd(${p.id},'status',this.value)">
    <option value="agendar"  ${p.status==='agendar'?'selected':''}>Agendar</option>
    <option value="agendado" ${p.status==='agendado'?'selected':''}>Agendado</option>
  </select>
</td>
<td style="min-width:135px">
  <button class="pill ${pillClass}" onclick="toggleTermo(${p.id})">${pillLabel}</button>
  <button class="term-btn" onclick="copyTermo(${p.id})">📋 Copiar termo</button>
</td>
<td style="min-width:165px">
  <textarea class="info-ta" onchange="upd(${p.id},'info',this.value)">${esc(p.info || '')}</textarea>
</td>
<td><button class="btn-del" onclick="askDel(${p.id})" title="Excluir pedido">🗑</button></td>
</tr>`;
  }).join('');
}

// ===== ATUALIZAR CAMPO =====
function upd(id, field, val) {
  const p = pedidos.find(x => x.id === id);
  if (p) { p[field] = val; saveData(); stats(); }
}

// ===== TOGGLE TERMO =====
function toggleTermo(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  p.termo = p.termo === 'confirmado' ? 'pendente' : 'confirmado';
  saveData();
  stats();
  render();
  showToast(p.termo === 'confirmado' ? '✅ Termo confirmado!' : 'Termo marcado como pendente.');
}

// ===== GERAR TERMO =====
function gerarTermo(p) {
  const k = KITS[p.kit] || { nome: '—', frascos: '—', avista: '—', parc: '—' };
  const hoje = p.data ? fmtData(p.data) : new Date().toLocaleDateString('pt-BR');

  let precoLinha = '';
  if (p.pagamento === 'avista')     precoLinha = k.avista + ' à vista';
  else if (p.pagamento === 'parcelado') precoLinha = 'ou ' + k.parc;
  else                               precoLinha = k.avista + ' à vista\nou ' + k.parc;

  const rua  = [p.rua, p.num].filter(Boolean).join(', ');
  const comp = p.comp ? '\n▸ COMPLEMENTO – ' + p.comp : '';
  const cidade = [p.cidade, p.uf].filter(Boolean).join(' - ');

  return `${k.nome}
${k.frascos} frascos
${precoLinha}
━━━━━━━━━━━━━━
ENDEREÇO DE ENTREGA
▸ RUA – ${rua || '—'}${comp}
▸ BAIRRO – ${p.bairro || '—'}
▸ CIDADE: ${cidade || '—'}
▸ CEP: ${p.cep || '—'}
━━━━━━━━━━━━━━
✔️ Pedido realizado voluntariamente
✔️ Informações fornecidas são verdadeiras
✔️ Prazo p/ pagamento: 1 dia após receber
✔️ Não parcelamos no boleto e pix
━━━━━━━━━━━━━━
⚠️ COMPROMISSO DE PAGAMENTO
Ao confirmar este pedido, o cliente declara ciência de que o pagamento deverá ser realizado dentro do prazo estipulado após o recebimento do produto. O não pagamento no prazo acordado resultará em acréscimos judiciais, encaminhamento aos órgãos de proteção ao crédito e negativação do CPF ${p.cpf || '—'} junto ao SPC/Serasa.
Nome: ${p.nome || '—'}
Data: ${hoje} Envio
Prazo de entrega de 5 a 10 dias uteis
━━━━━━━━━━━━━━
Digite "SIM" para confirmar seu pedido! Aguardo sua confirmação.`;
}

function copyTermo(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  const txt = gerarTermo(p);
  navigator.clipboard.writeText(txt)
    .then(() => showToast('📋 Termo copiado!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Termo copiado!');
    });
}

// ===== EXCLUIR =====
function askDel(id) { delId = id; document.getElementById('conf-overlay').classList.add('show'); }
function closeConf() { delId = null; document.getElementById('conf-overlay').classList.remove('show'); }
function confirmDel() {
  if (delId) {
    pedidos = pedidos.filter(p => p.id !== delId);
    saveData(); badge(); stats(); render();
    showToast('Pedido excluído.');
  }
  closeConf();
}

// ===== CONTADORES =====
function badge() {
  document.getElementById('count-badge').textContent = pedidos.length;
}
function stats() {
  document.getElementById('st-total').textContent = pedidos.length;
  document.getElementById('st-ag').textContent    = pedidos.filter(p => p.status === 'agendar').length;
  document.getElementById('st-ok').textContent    = pedidos.filter(p => p.status === 'agendado').length;
  document.getElementById('st-conf').textContent  = pedidos.filter(p => p.termo === 'confirmado').length;
}

// ===== TOAST =====
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = type === 'error' ? '#c0392b' : '#185FA5';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== FORMATAÇÕES =====
function fmtCPF(v) {
  v = v.replace(/\D/g, '');
  if (v.length > 3)  v = v.slice(0,3)  + '.' + v.slice(3);
  if (v.length > 7)  v = v.slice(0,7)  + '.' + v.slice(7);
  if (v.length > 11) v = v.slice(0,11) + '-' + v.slice(11);
  return v.slice(0, 14);
}
function fmtTel(v) {
  v = v.replace(/\D/g, '');
  if (v.length > 2)  v = '(' + v.slice(0,2) + ') ' + v.slice(2);
  if (v.length > 10) v = v.slice(0,10) + '-' + v.slice(10);
  return v.slice(0, 15);
}
function fmtCEP(v) {
  v = v.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
  return v.slice(0, 9);
}
function fmtData(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
