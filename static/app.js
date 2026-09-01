let state = null;
const canvasEl = document.getElementById("canvas");
const filterEl = document.getElementById("filter");
const toolEl = document.getElementById('tool');
const logEl = document.getElementById('log');

// Estado para cliques multi-passo
let pendingClicks = []; // armazena {x, y, el} dos cliques intermediarios

function appendLog(text) {
  const t = new Date().toLocaleTimeString();
  const p = document.createElement('div');
  p.textContent = `[${t}] ${text}`;
  p.className = 'log-line';
  if (logEl) {
    logEl.appendChild(p);
    while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }
  console.log(text);
}

async function fetchState() {
  const r = await fetch('/state');
  state = await r.json();
}

function clearPendingClicks() {
  pendingClicks.forEach(c => { if (c.el) c.el.classList.remove('selected'); });
  pendingClicks = [];
}

function renderGrid() {
  canvasEl.innerHTML = '';
  const w = state.width, h = state.height;
  canvasEl.style.gridTemplateColumns = `repeat(${w}, 10px)`;
  canvasEl.style.gridTemplateRows = `repeat(${h}, 10px)`;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const value = Number(state.pixels[y][x]) || 0;
      const d = document.createElement('div');
      d.className = value > 0 ? 'pixel on' : 'pixel';
      d.style.opacity = String(value / 255);
      d.dataset.x = x; d.dataset.y = y;
      d.addEventListener('click', (e) => handlePixelClick(d, x, y));
      canvasEl.appendChild(d);
    }
  }
}

async function handlePixelClick(d, x, y) {
  const tool = toolEl ? toolEl.value : 'point';

  // ---- PONTO (1 clique) ----
  if (tool === 'point') {
    const currentOpacity = Number(d.style.opacity || 0);
    const on = currentOpacity < 0.5;
    appendLog(`Pixel click (${x},${y}) -> ${on}`);
    try {
      const res = await fetch('/pixel', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({x,y,on})});
      if (!res.ok) appendLog(`Pixel update failed: ${res.status}`);
      else {
        d.classList.toggle('on', on);
        d.style.opacity = on ? '1' : '0';
      }
    } catch (err) { appendLog('Pixel update error: '+err); }
    return;
  }

  // ---- RETA (2 cliques) ----
  if (tool === 'line') {
    if (pendingClicks.length === 0) {
      pendingClicks.push({x, y, el: d});
      d.classList.add('selected');
      appendLog(`Reta: ponto A definido em (${x},${y})`);
    } else {
      const a = pendingClicks[0];
      appendLog(`Reta: ponto B definido em (${x},${y}), criando reta (${a.x},${a.y}) -> (${x},${y})`);
      clearPendingClicks();
      const payload = {type:'line', x0:a.x, y0:a.y, x1:x, y1:y};
      await sendPrimitive(payload);
    }
    return;
  }

  // ---- CIRCULO (2 cliques: centro + borda) ----
  if (tool === 'circle') {
    if (pendingClicks.length === 0) {
      pendingClicks.push({x, y, el: d});
      d.classList.add('selected');
      appendLog(`Círculo: centro definido em (${x},${y})`);
    } else {
      const c = pendingClicks[0];
      const r = Math.round(Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2)));
      appendLog(`Círculo: borda em (${x},${y}), raio=${r}, centro=(${c.x},${c.y})`);
      clearPendingClicks();
      const payload = {type:'circle', xc:c.x, yc:c.y, r: r};
      await sendPrimitive(payload);
    }
    return;
  }

  // ---- RETANGULO (2 cliques: canto superior-esq + canto inferior-dir) ----
  if (tool === 'rect') {
    if (pendingClicks.length === 0) {
      pendingClicks.push({x, y, el: d});
      d.classList.add('selected');
      appendLog(`Retângulo: canto A definido em (${x},${y})`);
    } else {
      const a = pendingClicks[0];
      const rx = Math.min(a.x, x);
      const ry = Math.min(a.y, y);
      const rw = Math.abs(x - a.x) + 1;
      const rh = Math.abs(y - a.y) + 1;
      appendLog(`Retângulo: canto B em (${x},${y}), pos=(${rx},${ry}) ${rw}x${rh}`);
      clearPendingClicks();
      const payload = {type:'rect', x:rx, y:ry, w:rw, h:rh};
      await sendPrimitive(payload);
    }
    return;
  }

  // ---- TRIANGULO (3 cliques) ----
  if (tool === 'triangle') {
    if (pendingClicks.length < 2) {
      pendingClicks.push({x, y, el: d});
      d.classList.add('selected');
      appendLog(`Triângulo: vértice ${pendingClicks.length} definido em (${x},${y}) — faltam ${3 - pendingClicks.length}`);
    } else {
      const a = pendingClicks[0];
      const b = pendingClicks[1];
      appendLog(`Triângulo: vértice 3 em (${x},${y}), criando triângulo (${a.x},${a.y})-(${b.x},${b.y})-(${x},${y})`);
      clearPendingClicks();
      const payload = {type:'triangle', x0:a.x, y0:a.y, x1:b.x, y1:b.y, x2:x, y2:y};
      await sendPrimitive(payload);
    }
    return;
  }
}

/**
 * Envia um primitivo ao servidor, pede redraw e atualiza a grade.
 */
async function sendPrimitive(payload) {
  try {
    const res = await fetch('/primitive', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const body = await res.text();
    if (!res.ok) {
      appendLog('Erro ao adicionar primitivo: ' + res.status + ' - ' + body);
      alert('Falha ao adicionar primitivo: ' + body);
    } else {
      appendLog('Primitivo adicionado: ' + body);
      await fetchState();
      renderGrid();
      updateEdInfo();
    }
  } catch (err) { appendLog('Erro ao criar primitivo: ' + err); }
}

/**
 * Atualiza as informacoes da ED na interface
 */
async function updateEdInfo() {
  try {
    const res = await fetch('/ed');
    const ed = await res.json();
    const info = document.getElementById('edInfo');
    if (ed.length === 0) {
      info.textContent = 'Nenhum primitivo na ED.';
    } else {
      const counts = {};
      ed.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
      const parts = Object.entries(counts).map(([k,v]) => `${v} ${k}(s)`);
      info.textContent = `ED contém ${ed.length} primitivo(s): ${parts.join(', ')}`;
    }
  } catch (err) { appendLog('Erro ao consultar ED: ' + err); }
}

/**
 * Mostra a lista detalhada da ED
 */
async function showEdList() {
  try {
    const res = await fetch('/ed');
    const ed = await res.json();
    const container = document.getElementById('edList');
    container.innerHTML = '';
    if (ed.length === 0) {
      container.textContent = 'ED vazia.';
      return;
    }
    ed.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'ed-item';
      const paramStr = Object.entries(p.params).map(([k,v]) => `${k}=${v}`).join(', ');
      div.textContent = `#${i+1} [${p.type}] ${paramStr}  (id: ${p.id.slice(0,8)}...)`;
      container.appendChild(div);
    });
  } catch (err) { appendLog('Erro ao listar ED: ' + err); }
}

async function init() {
  await fetchState();
  renderGrid();
  updateEdInfo();
}

// ---- Event Listeners ----

// Redesenhar (filtrado por tipo)
document.getElementById('redraw').addEventListener('click', async () => {
  const k = filterEl.value;
  appendLog(`Redesenhar solicitado: tipo=${k}`);
  try {
    const res = await fetch('/redraw', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({kind: k})});
    if (!res.ok) appendLog(`Redesenhar falhou: ${res.status}`);
    else appendLog('Redesenho concluído');
  } catch (err) { appendLog('Erro ao redesenhar: '+err); }
  await fetchState(); renderGrid();
});

// Limpar tela (não apaga a ED!)
document.getElementById('clear').addEventListener('click', async () => {
  appendLog('Limpar tela solicitado (ED preservada)');
  try {
    const res = await fetch('/clear', {method:'POST'});
    if (!res.ok) appendLog(`Limpar falhou: ${res.status}`);
    else appendLog('Tela limpa — ED preservada');
  } catch (err) { appendLog('Erro ao limpar: '+err); }
  await fetchState(); renderGrid();
});

// Atualizar
document.getElementById('refresh').addEventListener('click', async () => {
  appendLog('Atualização manual solicitada');
  await fetchState(); renderGrid(); updateEdInfo();
});

// Listar ED
document.getElementById('showEd').addEventListener('click', () => {
  showEdList();
});

// Limpar cliques pendentes quando trocar de ferramenta
toolEl.addEventListener('change', () => {
  clearPendingClicks();
  appendLog(`Ferramenta alterada para: ${toolEl.value}`);
});

// Adicionar primitivo via JSON
document.getElementById('addPrim').addEventListener('click', async () => {
  const raw = document.getElementById('prim').value;
  try {
    const payload = JSON.parse(raw);
    appendLog('Adicionando primitivo via JSON: ' + JSON.stringify(payload));
    await sendPrimitive(payload);
  } catch (e) { alert('JSON inválido: ' + e.message); }
});

init();
