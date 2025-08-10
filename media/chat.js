(function(){
  const vscode = acquireVsCodeApi();
  const $ = (s)=>document.querySelector(s);
  const messagesEl = $('#messages');
  const inputEl = $('#input');
  const modelEl = $('#model');
  const sendBtn = $('#send');
  const refreshBtn = $('#refresh');
  const micBtn = $('#mic');

  function appendMessage(role, text){
    const div = document.createElement('div');
    div.className = 'bubble ' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setModels(models){
    modelEl.innerHTML = '';
    for(const m of models){
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      modelEl.appendChild(opt);
    }
  }

  window.addEventListener('message', (event)=>{
    const msg = event.data;
    switch(msg.type){
      case 'models':
        setModels(msg.data || []);
        break;
      case 'chatStart':
        appendMessage('assistant', '');
        break;
      case 'chatDelta':
        const last = messagesEl.lastElementChild;
        if(last) last.textContent += msg.data;
        break;
      case 'chatEnd':
        break;
      case 'voiceToggled':
        // Show a small note in the UI
        appendMessage('assistant', `Voice Mode ${msg.enabled ? 'On' : 'Off'}`);
        break;
      case 'error':
        appendMessage('assistant', `Error: ${msg.error}`);
        break;
    }
  });

  sendBtn.addEventListener('click', ()=>{
    const text = inputEl.value.trim(); if(!text) return;
    appendMessage('user', text);
    inputEl.value = '';
    vscode.postMessage({ type: 'chat', text, model: modelEl.value });
  });

  refreshBtn.addEventListener('click', ()=>{
    vscode.postMessage({ type: 'requestModels' });
  });

  micBtn.addEventListener('click', ()=>{
    vscode.postMessage({ type: 'toggleVoice' });
  });

  // Action chips
  document.addEventListener('click', (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;
    if(t.classList.contains('chip')){
      const action = t.dataset.action;
      const base = inputEl.value.trim();
      if(action === 'plan') inputEl.value = base ? `Plan: ${base}` : 'Plan: ';
      if(action === 'debug') inputEl.value = base ? `Debug: ${base}` : 'Debug: ';
      if(action === 'explain') inputEl.value = base ? `Explain: ${base}` : 'Explain: ';
      inputEl.focus();
    }
  });

  vscode.postMessage({ type: 'requestModels' });
})();

