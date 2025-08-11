(function(){
  const vscode = acquireVsCodeApi();
  const $ = (s)=>document.querySelector(s);
  const tabs = document.querySelectorAll('.tab');
  function activateTab(id){
    tabs.forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const t = Array.from(tabs).find(t=>t.getAttribute('data-tab')===id);
    t?.classList.add('active');
    document.getElementById(id)?.classList.add('active');
  }
  tabs.forEach(t => t.addEventListener('click', ()=>{
    const id = t.getAttribute('data-tab');
    activateTab(id);
  }));

  // Browser
  const urlEl = $('#url');
  function doBrowse(url){
    urlEl.value = url;
    vscode.postMessage({ type: 'browse', url });
  }
  $('#go').addEventListener('click', ()=>{
    const url = urlEl.value.trim(); if(!url) return;
    doBrowse(url);
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
    if(m.type === 'showTab'){
      activateTab(m.tab);
    }
    if(m.type === 'triggerBrowse' && m.url){
      activateTab('browser');
      doBrowse(m.url);
    }
    if(m.type === 'setSandbox'){
      if(typeof m.html === 'string') $('#html').value = m.html;
      if(typeof m.css === 'string') $('#css').value = m.css;
      if(typeof m.js === 'string') $('#js').value = m.js;
      document.getElementById('run').click();
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

