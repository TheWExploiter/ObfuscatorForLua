document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('inputCode');
  const output = document.getElementById('output');
  const obfuscateBtn = document.getElementById('obfuscateBtn');
  const maxSecurity = document.getElementById('maxSecurity');
  const downloads = document.getElementById('downloads');
  const webhookInput = document.getElementById('webhookUrl');

  function generateRandomVar(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function obfuscateCode(code, maxSecure = false) {
    const watermark = "--[(This File Has Been Obfuscated By Lua Obfuscator V3)]--\n\n";
    let encoded = btoa(unescape(encodeURIComponent(code)));
    let variable = generateRandomVar(12);
    let result = `${watermark}local ${variable} = '${encoded}'\nloadstring(game:GetService('HttpService'):Base64Decode(${variable}))()`;
    
    if (maxSecure) {
      result = result.replace(/ /g, '\t'); // light anti-copy mechanism
    }

    return result;
  }

  function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.textContent = `Download ${fileName}`;
    a.className = 'download-link';
    downloads.innerHTML = '';
    downloads.appendChild(a);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Obfuscated code copied to clipboard!');
    }).catch(err => {
      alert('Clipboard copy failed.');
    });
  }

  obfuscateBtn.addEventListener('click', () => {
    const code = input.value.trim();
    const webhook = webhookInput.value.trim();

    if (!code) return alert('Please paste your Lua code.');

    const obfuscated = obfuscateCode(code, maxSecurity.checked);
    output.value = obfuscated;

    // Clipboard auto copy
    copyToClipboard(obfuscated);

    // Download with time
    const now = new Date();
    const timestamp = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    downloadFile(obfuscated, `obfuscated_${timestamp}.lua`);

    // Webhook log (optional)
    if (webhook) {
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `New obfuscation at ${timestamp}` })
      });
    }
  });
});
