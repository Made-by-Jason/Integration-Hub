const LS_KEY = 'ihub.templates.v1';
const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

const defaultTemplates = [
  {
    id: crypto.randomUUID(),
    name: 'React App Shell',
    type: 'Web Page',
    language: 'HTML',
    dependencies: ['https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js','https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js'],
    content: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{AppName}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    const e = React.createElement;
    function {{ComponentName}}() { return e('div', null, 'Hello {{AppName}}'); }
    ReactDOM.createRoot(document.getElementById('root')).render(e({{ComponentName}}));
  </script>
</body>
</html>`
  },
  {
    id: crypto.randomUUID(),
    name: 'Express API Route',
    type: 'API',
    language: 'JavaScript',
    dependencies: ['express'],
    content: `import express from 'express';
const app = express();
app.get('/api/{{Resource}}', (req, res) => {
  res.json({ message: 'Hello {{Resource}}', ok: true });
});
app.listen({{Port}}, () => console.log('API on :{{Port}}'));`
  },
  {
    id: crypto.randomUUID(),
    name: 'Web Component',
    type: 'Web Component',
    language: 'JavaScript',
    dependencies: [],
    content: `class {{ComponentName}} extends HTMLElement {
  connectedCallback(){ this.innerHTML = '<button>{{Label}}</button>'; }
}
customElements.define('{{TagName}}', {{ComponentName}});`
  },
  {
    id: crypto.randomUUID(),
    name: 'OpenAPI Spec',
    type: 'API',
    language: 'Markdown',
    dependencies: [],
    content: `openapi: 3.0.0
info:
  title: {{ApiName}}
  version: {{Version}}
paths:
  /{{Resource}}:
    get:
      summary: List {{Resource}}
      responses:
        '200':
          description: OK`
  }
];

let state = {
  templates: [],
  selectedId: null,
};

function loadTemplates() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    state.templates = raw ? JSON.parse(raw) : defaultTemplates;
  } catch {
    state.templates = defaultTemplates;
  }
}
function saveTemplates() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.templates));
}

function renderTemplateList() {
  const list = q('#tmpl-list');
  const filter = q('#tmpl-filter').value;
  list.innerHTML = '';
  state.templates
    .filter(t => filter === 'all' || t.type === filter)
    .forEach(t => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge">${t.type}</span>
          <strong>${t.name}</strong>
        </div>
        <div class="actions-row">
          <button class="automation-btn" data-act="use">Use</button>
          <button class="automation-btn" data-act="edit">Edit</button>
        </div>`;
      item.querySelector('[data-act="use"]').onclick = () => selectTemplate(t.id);
      item.querySelector('[data-act="edit"]').onclick = () => { selectTemplate(t.id); scrollToEditor(); };
      list.appendChild(item);
    });
}

function renderMarketplace() {
  const market = q('#tmpl-market');
  market.innerHTML = '';
  const picks = [
    { name: 'Flask API Blueprint', type: 'API', language: 'Python', content: `from flask import Flask\napp = Flask(__name__)\n@app.get('/{{Resource}}')\ndef r(): return {'ok': True}\napp.run({{Port}})` },
    { name: 'Tailwind Landing Page', type: 'Web Page', language: 'HTML', content: `<!doctype html><html><head><script src="https://cdn.tailwindcss.com"></script><title>{{AppName}}</title></head><body class="p-8"><h1 class="text-3xl">{{Headline}}</h1></body></html>` },
  ];
  picks.forEach(p => {
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="badge">${p.type}</span>
        <strong>${p.name}</strong>
      </div>
      <button class="automation-btn">Add</button>`;
    item.querySelector('button').onclick = () => {
      const t = { id: crypto.randomUUID(), name: p.name, type: p.type, language: p.language, content: p.content, dependencies: [] };
      state.templates.unshift(t); saveTemplates(); renderTemplateList(); hydrateSelection(t.id);
    };
    market.appendChild(item);
  });
}

function selectTemplate(id) {
  state.selectedId = id;
  hydrateSelection(id);
}

function hydrateSelection(id) {
  const t = state.templates.find(x => x.id === id);
  const sel = q('#tmpl-select');
  sel.value = id;
  q('#tmpl-name').value = t?.name || '';
  q('#tmpl-type').value = t?.type || 'Web Page';
  q('#tmpl-lang').value = t?.language || 'HTML';
  q('#tmpl-source').value = t?.content || '';
  q('#tmpl-deps').value = (t?.dependencies || []).join(', ');
  q('#tmpl-meta').textContent = t ? `${t.language} • ${t.type}` : '—';
  buildPlaceholderForm(t?.content || '');
  updateDepsBadge(t?.dependencies || []);
}

function buildPlaceholderForm(content) {
  const form = q('#placeholder-form');
  form.innerHTML = '';
  const placeholders = Array.from(new Set((content.match(/\{\{([A-Za-z0-9_]+)\}\}/g) || []).map(s => s.slice(2, -2))));
  placeholders.forEach(ph => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <label class="text-light" style="display:block;margin-bottom:6px;">${ph}</label>
      <input data-ph="${ph}" type="text" placeholder="${ph}" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:6px; background:var(--background); color:var(--text);">`;
    form.appendChild(wrap);
  });
}

function generateCode() {
  const t = state.templates.find(x => x.id === state.selectedId);
  if (!t) return;
  let out = t.content;
  qa('input[data-ph]').forEach(inp => {
    const key = inp.dataset.ph;
    const val = inp.value || key;
    out = out.replaceAll(`{{${key}}}`, val);
  });
  q('#code-output').value = out;
}

function updateDepsBadge(deps) {
  q('#deps-badge').textContent = `Dependencies: ${deps.length ? deps.length : '—'}`;
}

function newTemplate() {
  const t = {
    id: crypto.randomUUID(),
    name: 'Untitled Template',
    type: 'Web Page',
    language: 'HTML',
    dependencies: [],
    content: '<!-- {{AppName}} -->'
  };
  state.templates.unshift(t); saveTemplates();
  renderTemplateList(); populateSelect(); selectTemplate(t.id);
}

function populateSelect() {
  const sel = q('#tmpl-select');
  sel.innerHTML = state.templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function saveCurrentTemplate() {
  const id = state.selectedId || crypto.randomUUID();
  const idx = state.templates.findIndex(t => t.id === id);
  const data = {
    id,
    name: q('#tmpl-name').value.trim() || 'Untitled',
    type: q('#tmpl-type').value,
    language: q('#tmpl-lang').value,
    content: q('#tmpl-source').value,
    dependencies: (q('#tmpl-deps').value || '').split(',').map(s => s.trim()).filter(Boolean)
  };
  if (idx >= 0) state.templates[idx] = data; else state.templates.unshift(data);
  state.selectedId = data.id;
  saveTemplates(); renderTemplateList(); populateSelect(); hydrateSelection(data.id);
}

function deleteTemplate() {
  if (!state.selectedId) return;
  state.templates = state.templates.filter(t => t.id !== state.selectedId);
  saveTemplates(); renderTemplateList(); populateSelect();
  state.selectedId = state.templates[0]?.id || null;
  hydrateSelection(state.selectedId);
}

function duplicateTemplate() {
  const t = state.templates.find(x => x.id === state.selectedId);
  if (!t) return;
  const copy = { ...t, id: crypto.randomUUID(), name: `${t.name} Copy` };
  state.templates.unshift(copy); saveTemplates(); renderTemplateList(); populateSelect(); selectTemplate(copy.id);
}

function exportSelected() {
  const t = state.templates.find(x => x.id === state.selectedId);
  if (!t) return;
  const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${t.name.replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.id) data.id = crypto.randomUUID();
      state.templates.unshift(data);
      saveTemplates(); renderTemplateList(); populateSelect(); selectTemplate(data.id);
    } catch (e) {
      alert('Invalid template file.');
    }
  };
  reader.readAsText(file);
}

function copyCode() {
  const v = q('#code-output').value;
  navigator.clipboard.writeText(v).then(() => showToast('Code copied.'));
}

function downloadCode() {
  const t = state.templates.find(x => x.id === state.selectedId);
  const ext = (t?.language || 'txt').toLowerCase().startsWith('java') ? 'js' :
              t?.language?.toLowerCase() === 'typescript' ? 'ts' :
              t?.language?.toLowerCase() === 'html' ? 'html' :
              t?.language?.toLowerCase() === 'python' ? 'py' :
              t?.language?.toLowerCase() === 'markdown' ? 'md' : 'txt';
  const blob = new Blob([q('#code-output').value], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(t?.name || 'code').replace(/\s+/g,'_')}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function scrollToEditor() {
  q('#tmpl-source')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showToast(msg) {
  let toast = document.getElementById('builder-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'builder-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
}

export function initBuilder() {
  const mount = document.getElementById('builder-root');
  if (!mount) return;
  // load UI
  fetch('components/builder.html').then(r => r.text()).then(html => {
    mount.innerHTML = html;
    // state
    loadTemplates();
    renderTemplateList();
    renderMarketplace();
    populateSelect();
    if (state.templates[0]) selectTemplate(state.templates[0].id);

    // events
    q('#tmpl-filter').onchange = renderTemplateList;
    q('#tmpl-select').onchange = e => selectTemplate(e.target.value);
    q('#tmpl-new').onclick = newTemplate;
    q('#tmpl-export').onclick = exportSelected;
    q('#tmpl-import').onclick = () => q('#tmpl-file').click();
    q('#tmpl-file').onchange = e => e.target.files[0] && importFromFile(e.target.files[0]);
    q('#save-template').onclick = saveCurrentTemplate;
    q('#tmpl-delete').onclick = () => { if (confirm('Delete template?')) deleteTemplate(); };
    q('#tmpl-duplicate').onclick = duplicateTemplate;
    q('#generate-code').onclick = () => { saveCurrentTemplate(); generateCode(); showToast('Generated!'); };
    q('#copy-code').onclick = copyCode;
    q('#download-code').onclick = downloadCode;
    // live form regen on template source change
    q('#tmpl-source').addEventListener('input', () => buildPlaceholderForm(q('#tmpl-source').value));
    q('#tmpl-deps').addEventListener('input', () => updateDepsBadge((q('#tmpl-deps').value || '').split(',').map(s=>s.trim()).filter(Boolean)));
  });
}

export const builderAPI = {
  getTemplates: () => [...state.templates],
  addTemplate: (t) => { const x = { id: crypto.randomUUID(), dependencies: [], ...t }; state.templates.unshift(x); saveTemplates(); },
  generateFrom: (id, params={}) => {
    const t = state.templates.find(z => z.id === id);
    if (!t) return '';
    let out = t.content;
    Object.entries(params).forEach(([k,v]) => out = out.replaceAll(`{{${k}}}`, String(v)));
    return out;
  }
};
