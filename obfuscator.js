function randomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function insertJunkFunctions(count = 3) {
  let junk = '';
  for (let i = 0; i < count; i++) {
    const fn = randomString();
    junk += `function ${fn}() return ${Math.floor(Math.random() * 9999)} end\n`;
  }
  return junk;
}

function insertFakeGotos(count = 3) {
  let code = '';
  for (let i = 0; i < count; i++) {
    const label = randomString();
    code += `::${label}:: \nif false then goto ${label} end\n`;
  }
  return code;
}

function renameVariables(code) {
  const varRegex = /local\s+(\w+)/g;
  const map = {};
  let match;
  while ((match = varRegex.exec(code)) !== null) {
    const oldName = match[1];
    if (!map[oldName]) {
      map[oldName] = randomString();
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      code = code.replace(regex, map[oldName]);
    }
  }
  return code;
}

function obfuscateLua(code) {
  let obfuscated = '';
  obfuscated += '-- Obfuscated by Cat\n';
  obfuscated += '-- Original Code Preserved in Execution\n\n';
  obfuscated += insertJunkFunctions();
  obfuscated += insertFakeGotos();
  obfuscated += renameVariables(code);
  obfuscated += insertFakeGotos();
  return obfuscated;
}

document.getElementById('obfuscateBtn').addEventListener('click', async () => {
  const inputCode = document.getElementById('inputCode').value;
  if (!inputCode) return alert('Please paste some Lua code first.');

  const obfuscatedCode = obfuscateLua(inputCode);
  const downloadsEl = document.getElementById('downloads');
  downloadsEl.innerHTML = '';

  const makeLink = (text, data) => {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = text.replace(/\s+/g, '_').toLowerCase() + '.lua';
    a.textContent = `Download ${text}`;
    return a;
  };

  downloadsEl.appendChild(makeLink('Original Code', inputCode));
  downloadsEl.appendChild(makeLink('Obfuscated Code', obfuscatedCode));

  const webhookUrl = document.getElementById('webhookUrl').value.trim();
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_code: inputCode,
          obfuscated_code: obfuscatedCode,
          timestamp: new Date().toISOString()
        })
      });
      console.log('Webhook sent successfully');
    } catch (err) {
      console.error('Failed to send webhook:', err);
    }
  }
});
