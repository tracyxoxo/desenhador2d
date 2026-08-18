let state = null;
const canvasEl = document.getElementById("canvas");
const filterEl = document.getElementById("filter");
const toolEl = document.getElementById('tool');
const logEl = document.getElementById('log');
let pendingLine = null; // {x,y,el}

function appendLog(text) {
  const t = new Date().toLocaleTimeString();
  const p = document.createElement('div');
  p.textContent = `[${t}] ${text}`;
  p.className = 'log-line';
  if (logEl) {
    logEl.appendChild(p);
    // keep last 200 lines
    while (logEl.children.length > 200) logEl.removeChild(logEl.firstChild);
    // scroll to bottom
    logEl.scrollTop = logEl.scrollHeight;
  }
  console.log(text);
}

async function fetchState() {
  const r = await fetch('/state');
  state = await r.json();
}

function renderGrid() {
  canvasEl.innerHTML = '';
  const w = state.width, h = state.height;
  canvasEl.style.gridTemplateColumns = `repeat(${w}, 10px)`;
  canvasEl.style.gridTemplateRows = `repeat(${h}, 10px)`;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = document.createElement('div');
      d.className = state.pixels[y][x] ? 'pixel on' : 'pixel';
      d.dataset.x = x; d.dataset.y = y;
      d.addEventListener('click', async (e) => {
        const tool = toolEl ? toolEl.value : 'point';
        if (tool === 'point') {
          const on = !d.classList.contains('on');
          appendLog(`Pixel click (${x},${y}) -> ${on}`);
          try {
            const res = await fetch('/pixel', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({x,y,on})});
            if (!res.ok) appendLog(`Pixel update failed: ${res.status}`);
            else d.classList.toggle('on');
          } catch (err) { appendLog('Pixel update error: '+err); }
          return;
        }

        if (tool === 'line') {
          // two-click line: first click sets start, second click creates primitive
          if (!pendingLine) {
            pendingLine = {x, y, el: d};
            d.classList.add('selected');
            appendLog(`Line start set at (${x},${y})`);
          } else {
            const a = pendingLine;
            const b = {x,y};
            appendLog(`Line end set at (${x},${y}), creating line ${a.x},${a.y} -> ${b.x},${b.y}`);
            // remove visual mark
            if (a.el) a.el.classList.remove('selected');
            pendingLine = null;
            // send primitive to server
            const payload = {type:'line', x0:a.x, y0:a.y, x1:b.x, y1:b.y};
            try {
              const res = await fetch('/primitive', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
              const txt = await res.text();
              if (!res.ok) {
                appendLog('Add primitive failed: '+res.status+' - '+txt);
                alert('Falha ao adicionar primitivo: '+txt);
              } else {
                appendLog('Primitive added: '+txt);
                // ask server to redraw
                await fetch('/redraw', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({kind:'all'})});
                await fetchState(); renderGrid();
              }
            } catch (err) { appendLog('Error creating line: '+err); }
          }
          return;
        }
        // other tools could be added here
      });
      canvasEl.appendChild(d);
    }
  }
}

async function init() {
  await fetchState();
  renderGrid();
}

document.getElementById('redraw').addEventListener('click', async () => {
  const k = filterEl.value;
  appendLog(`Redraw requested: kind=${k}`);
  try {
    const res = await fetch('/redraw', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({kind: k})});
    if (!res.ok) appendLog(`Redraw failed: ${res.status}`);
    else appendLog('Redraw completed');
  } catch (err) { appendLog('Redraw error: '+err); }
  await fetchState(); renderGrid();
});

document.getElementById('clear').addEventListener('click', async () => {
  appendLog('Clear screen requested');
  try {
    const res = await fetch('/clear', {method:'POST'});
    if (!res.ok) appendLog(`Clear failed: ${res.status}`);
    else appendLog('Screen cleared');
  } catch (err) { appendLog('Clear error: '+err); }
  await fetchState(); renderGrid();
});

document.getElementById('refresh').addEventListener('click', async () => { await fetchState(); renderGrid(); });

document.getElementById('refresh').addEventListener('click', () => appendLog('Manual refresh requested'));

document.getElementById('addPrim').addEventListener('click', async () => {
  const txt = document.getElementById('prim').value;
  try {
    const payload = JSON.parse(txt);
    appendLog('Adding primitive: '+JSON.stringify(payload));
    const res = await fetch('/primitive', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const txt = await res.text();
    if (!res.ok) {
      appendLog('Add primitive failed: '+res.status+' - '+txt);
      alert('Falha ao adicionar primitivo: '+txt);
    } else {
      appendLog('Primitive added: '+txt);
      alert('Primitivo adicionado à ED');
    }
  } catch (e) { alert('JSON inválido'); }
});

init();
