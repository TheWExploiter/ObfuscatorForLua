function base64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function stringEncrypt(str) {
  const encoded = base64(str).split('').reverse().join('');
  return `string.reverse('${encoded}')`;
}

function flattenControl(code) {
  const lines = code.split(/\n+/);
  let result = 'local __flow = {...}; local __i = 1; while __i <= #__flow do __flow[__i]() __i = __i + 1 end\n';
  result += 'local function junk1() end local function junk2() end\n';
  lines.forEach((line, i) => {
    result += `__flow[${i+1}] = function() ${line} end\n`;
  });
  return result;
}

function deepObfuscate(code) {
  let final = '';
  final += '-- Obfuscated by Cats Obfuscator\n';
  final += '-- Good Obfuscator\n\n';
  final += 'local nonsense = 1*1 + 0/1 - 0\n';
  final += flattenControl(code);
  final += '\n-- V1.2\nif false then while true do print(math.random()) end end\n';
  return final;
}

const webhookUrl = document.getElementById('webhookUrl').value; // input field in HTML
sendToWebhook(webhookUrl, originalCode, obfuscatedCode);

function sendToWebhook(webhookUrl, originalCode, obfuscatedCode) {
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: '**New Lua Obfuscation Submitted!**',
      embeds: [
        {
          title: 'Original Lua Code',
          description: '```lua\\n' + originalCode.slice(0, 1900) + '\\n```'
        },
        {
          title: 'Obfuscated Code',
          description: '```lua\\n' + obfuscatedCode.slice(0, 1900) + '\\n```'
        }
      ]
    })
  });
}
