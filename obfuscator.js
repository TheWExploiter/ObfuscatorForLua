function randomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function insertTrashCode(lines = 15) {
  let trash = '';
  for (let i = 0; i < lines; i++) {
    const rand = randomString();
    trash += `-- junk\\nlocal ${rand} = ${Math.random().toFixed(5)}\\n`;
    trash += `if false then print("${randomString()}") end\\n`;
  }
  return trash;
}

function renameVariablesDeep(code) {
  const map = {};
  return code.replace(/local\\s+(\\w+)/g, (match, name) => {
    if (!map[name]) map[name] = randomString();
    return `local ${map[name]}`;
  }).replace(/(\\W|^)(\\w+)(\\W|$)/g, (match, pre, word, post) => {
    return map[word] ? `${pre}${map[word]}${post}` : match;
  });
}

function obfuscateLua(code) {
  const head = '-- Obfuscated by Maximum V5🔥🗿 [MAX+++++]\\n-- Good luck lol\\n\\n';
  const trashStart = insertTrashCode(20);
  const trashEnd = insertTrashCode(10);
  const renamed = renameVariablesDeep(code);
  return head + trashStart + renamed + '\\n' + trashEnd;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function sendToWebhook(webhookURL, original, obfuscated) {
  if (!webhookURL) return;

  const payload = {
    content: '**New Lua Obfuscation**',
    embeds: [
      {
        title: 'Original Code',
        description: '```lua\\n' + original.slice(0, 1900) + '\\n```'
      },
      {
        title: 'Obfuscated Code',
        description: '```lua\\n' + obfuscated.slice(0, 1900) + '\\n```'
      }
    ]
  };

  fetch(webhookURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

document.getElementById('obfuscateBtn').onclick = () => {
  const inputCode = document.getElementById('luaInput').value;
  const webhook = document.getElementById('webhookUrl').value;

  const obfuscated = obfuscateLua(inputCode);
  document.getElementById('output').value = obfuscated;

  sendToWebhook(webhook, inputCode, obfuscated);
  downloadFile('ObfuscatedFile.lua', obfuscated);
};
