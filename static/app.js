let state = null;
const canvasEl = document.getElementById("canvas");
const filterEl = document.getElementById("filter");
const toolEl = document.getElementById('tool');
const logEl = document.getElementById('log');

// Estado para cliques multi-passo
let pendingClicks = []; // armazena {x, y, el} dos cliques intermediarios
let dragState = null; // {tool, start, end}

function getCellFromEvent(event) {
  const target = event.target.closest('.pixel');
  if (!target) return null;
  return {
    x: Number(target.dataset.x),
    y: Number(target.dataset.y),
    el: target
  };
}

function getLinePoints(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    points.push({x, y});
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

function getCirclePoints(xc, yc, r) {
  const points = new Set();
  let x = 0;
  let y = r;
  let d = 1 - r;

  while (y >= x) {
    const pts = [
      [xc + x, yc + y], [xc - x, yc + y], [xc + x, yc - y], [xc - x, yc - y],
      [xc + y, yc + x], [xc - y, yc + x], [xc + y, yc - x], [xc - y, yc - x]
    ];
    pts.forEach(([px, py]) => points.add(`${px},${py}`));

    x += 1;
    if (d < 0) {
      d += 2 * x + 1;
    } else {
      y -= 1;
      d += 2 * (x - y) + 1;
    }
  }

  return [...points].map(key => {
    const [x, y] = key.split(',').map(Number);
    return {x, y};
  });
}

function getRectPoints(x0, y0, x1, y1) {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  const points = [];
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (x === left || x === right || y === top || y === bottom) {
        points.push({x, y});
      }
    }
  }
  return points;
}

function renderPreviewGrid() {
  if (!dragState || !dragState.start || !dragState.end) return new Map();
  const previewMap = new Map();
  const { tool, start, end } = dragState;
  let points = [];

  if (tool === 'line') {
    points = getLinePoints(start.x, start.y, end.x, end.y);
  } else if (tool === 'circle') {
    const r = Math.round(Math.hypot(end.x - start.x, end.y - start.y));
    points = getCirclePoints(start.x, start.y, r);
  } else if (tool === 'rect') {
    points = getRectPoints(start.x, start.y, end.x, end.y);
  }

  points.forEach(({x, y}) => previewMap.set(`${x},${y}`, true));
  return previewMap;
}

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
  const previewMap = renderPreviewGrid();
  canvasEl.style.gridTemplateColumns = `repeat(${w}, var(--pixel-size))`;
  canvasEl.style.gridTemplateRows = `repeat(${h}, var(--pixel-size))`;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const value = Number(state.pixels[y][x]) || 0;
      const isPreview = previewMap.has(`${x},${y}`);
      const d = document.createElement('div');
      d.className = value > 0 ? 'pixel on' : 'pixel';
      if (isPreview) d.classList.add('preview');
      d.style.opacity = String(isPreview ? 1 : value / 255);
      d.dataset.x = x; d.dataset.y = y;
      d.addEventListener('click', (e) => handlePixelClick(d, x, y));
      d.addEventListener('pointerdown', handleCanvasPointerDown);
      d.addEventListener('pointermove', handleCanvasPointerMove);
      d.addEventListener('pointerup', handleCanvasPointerUp);
      canvasEl.appendChild(d);
    }
  }
}

async function handlePixelClick(d, x, y) {
  const tool = toolEl ? toolEl.value : 'point';

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

function handleCanvasPointerDown(event) {
  const cell = getCellFromEvent(event);
  if (!cell) return;
  const tool = toolEl ? toolEl.value : 'point';
  if (tool === 'point' || tool === 'triangle') return;

  dragState = {
    tool,
    start: {x: cell.x, y: cell.y},
    end: {x: cell.x, y: cell.y}
  };
  pendingClicks = [{x: cell.x, y: cell.y, el: cell.el}];
  if (cell.el) cell.el.classList.add('selected');
  renderGrid();
}

function handleCanvasPointerMove(event) {
  if (!dragState) return;
  const cell = getCellFromEvent(event);
  if (!cell) return;
  dragState.end = {x: cell.x, y: cell.y};
  renderGrid();
}

async function handleCanvasPointerUp(event) {
  if (!dragState) return;
  const cell = getCellFromEvent(event) || dragState.end;
  if (!cell) {
    dragState = null;
    clearPendingClicks();
    renderGrid();
    return;
  }

  const { tool, start } = dragState;
  const end = {x: cell.x, y: cell.y};

  if (tool === 'line' && (start.x !== end.x || start.y !== end.y)) {
    appendLog(`Reta elástica: (${start.x},${start.y}) -> (${end.x},${end.y})`);
    await sendPrimitive({type:'line', x0:start.x, y0:start.y, x1:end.x, y1:end.y});
  } else if (tool === 'circle' && (start.x !== end.x || start.y !== end.y)) {
    const r = Math.round(Math.hypot(end.x - start.x, end.y - start.y));
    appendLog(`Círculo elástico: centro=(${start.x},${start.y}), raio=${r}`);
    await sendPrimitive({type:'circle', xc:start.x, yc:start.y, r});
  } else if (tool === 'rect' && (start.x !== end.x || start.y !== end.y)) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x) + 1;
    const h = Math.abs(end.y - start.y) + 1;
    appendLog(`Retângulo elástico: pos=(${x},${y}), tam=${w}x${h}`);
    await sendPrimitive({type:'rect', x, y, w, h});
  }

  dragState = null;
  clearPendingClicks();
  renderGrid();
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
