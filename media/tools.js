(function(){
  const vscode = acquireVsCodeApi();
  const $ = (s)=>document.querySelector(s);
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.addEventListener('click', ()=>{
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const id = t.getAttribute('data-tab');
    document.getElementById(id)?.classList.add('active');
  }));

  // Browser
  const urlEl = $('#url');
  $('#go').addEventListener('click', ()=>{
    const url = urlEl.value.trim(); if(!url) return;
    vscode.postMessage({ type: 'browse', url });
  });
  $('#openExternal').addEventListener('click', ()=>{
    const url = urlEl.value.trim(); if(!url) return;
    vscode.postMessage({ type: 'openExternal', url });
  });
  window.addEventListener('message', e => {
    const m = e.data;
    if(m.type === 'browseResult'){
      $('#browseResult').textContent = m.content;
    }
    if(m.type === 'browseError'){
      $('#browseResult').textContent = 'Error: ' + m.error;
    }
  });

  // Sandbox
  $('#run').addEventListener('click', ()=>{
    const html = $('#html').value;
    const css = $('#css').value;
    const js = $('#js').value;
    const code = `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
    const iframe = document.getElementById('preview');
    iframe.srcdoc = code;
  });
})();

