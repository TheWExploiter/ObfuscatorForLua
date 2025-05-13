function randomString(length = 15) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function insertTrashCode(lines = 99) {
  let trash = '';
  for (let i = 0; i < lines; i++) {
    const rand = randomString();
    trash += `-- junk\nlocal ${rand} = ${Math.random().toFixed(5)}\n`;
    trash += `if false then print("${randomString()}") end\n`;
  }
  return trash;
}

function renameVariablesDeep(code) {
  const map = {};
  return code.replace(/local\s+(\w+)/g, (match, name) => {
    if (!map[name]) map[name] = randomString();
    return `local ${map[name]}`;
  }).replace(/(\W|^)(\w+)(\W|$)/g, (match, pre, word, post) => {
    return map[word] ? `${pre}${map[word]}${post}` : match;
  });
}

function obfuscateLua(code) {
  const head = '-- Obfuscated by Cat]\n-- Obfuscator V1.2\n\n';
  const trashStart = insertTrashCode(20);
  const trashEnd = insertTrashCode(10);
  const renamed = renameVariablesDeep(code);
  return head + trashStart + renamed + '\n' + trashEnd;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sendToWebhook(webhookURL, original, obfuscated) {
  if (!webhookURL) return;

  const payload = {
    content: '**New Lua Obfuscation**',
    embeds: [
      {
        title: 'Original Code',
        description: '```lua\n' + original.slice(0, 1900) + '\n```'
      },
      {
        title: 'Obfuscated Code',
        description: '```lua\n' + obfuscated.slice(0, 1900) + '\n```'
      }
    ]
  };

  fetch(webhookURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => {
    if (!r.ok) console.error('Webhook failed:', r.statusText);
  }).catch(console.error);
}

document.getElementById('obfuscateBtn').onclick = () => {
  const input = document.getElementById('inputCode');
  const output = document.getElementById('output');
  const webhook = document.getElementById('webhookUrl').value;

  if (!input || !output) return alert('Missing input/output elements.');
  if (!input.value.trim()) return alert('Paste some Lua code first.');

  const originalCode = input.value.trim();
  const obfuscated = obfuscateLua(originalCode);

  output.value = obfuscated;

  sendToWebhook(webhook, originalCode, obfuscated);
  downloadFile('ObfuscatedFile.lua', obfuscated);
};
