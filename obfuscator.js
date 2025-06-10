// Generate a shuffled base64 charset
function shuffleBase64Chars() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// Encode string using *shuffled* base64 charset
function encodeBase64WithCharset(str, charset) {
  const standardB64 = btoa(str);
  // Map standard base64 chars to shuffled charset
  const stdChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (const c of standardB64) {
    if (c === '=') {
      result += '=';
    } else {
      const idx = stdChars.indexOf(c);
      result += charset[idx];
    }
  }
  return result;
}

function insertStealthDecoder() {
  const decoderFuncName = generateRandomName('_decode');
  const hiddenPrintFuncName = generateRandomName('_hiddenPrint');
  const b64Var = generateRandomName('_b64chars');

  const shuffledCharset = shuffleBase64Chars();

  const decoderCode = `--[[This File Has Been Obfuscated By Z-Obfuscator]]--
local ${b64Var}='${shuffledCharset}'
function ${decoderFuncName}(data)
  data = string.gsub(data, '[^'..${b64Var}..'=]', '')
  return (data:gsub('.', function(x)
    if x == '=' then return '' end
    local r,f='',(${b64Var}:find(x)-1)
    for i=6,1,-1 do r=r..(f%2^i - f%2^(i-1) > 0 and '1' or '0') end
    return r
  end):gsub('%d%d%d%d%d%d%d%d', function(x)
    local c=0
    for i=1,8 do
      c=c + (x:sub(i,i)=='1' and 2^(8-i) or 0)
    end
    return string.char(c)
  end))
end

function ${hiddenPrintFuncName}(str)
  print(str)
end
`;

  return { decoderCode, decoderFuncName, hiddenPrintFuncName, shuffledCharset };
}

// Now, modify obfuscateStrings and hidePrintStatements to use this shuffled charset encoder

function obfuscateStrings(code, decoderName, shuffledCharset) {
  return code.replace(/"(.*?)"/g, (_, str) => {
    const encoded = encodeBase64WithCharset(str, shuffledCharset);
    return `${decoderName}("${encoded}")`;
  });
}

function hidePrintStatements(code, hiddenPrintName, decoderName, shuffledCharset) {
  return code.replace(/print\s*([^)]*)/g, (_, arg) => {
    const encoded = encodeBase64WithCharset(arg.trim(), shuffledCharset);
    return `${hiddenPrintName}(${decoderName}("${encoded}"))`;
  });
}

// In your main event listener, call these with shuffledCharset:

document.getElementById("obfuscateBtn").addEventListener("click", () => {
  let code = document.getElementById("inputCode").value;
  const webhookUrl = document.getElementById("webhookUrl").value;
  const maxSecurity = document.getElementById("maxSecurity").checked;

  // Insert watermark on top
  const watermark = `--[[This File Has Been Obfuscated By Z-Obfuscator]]--\n`;

  // Step 1: Insert decoder and hidden print with shuffled charset
  const { decoderCode, decoderFuncName, hiddenPrintFuncName, shuffledCharset } = insertStealthDecoder();

  // Step 2: Rename functions and locals
  code = renameFunctions(code);
  code = renameLocals(code);

  // Step 3: Hide print calls with hiddenPrint func and encode args with shuffled charset
  code = hidePrintStatements(code, hiddenPrintFuncName, decoderFuncName, shuffledCharset);

  // Step 4: Obfuscate all strings by replacing them with runtime decoder calls (shuffled charset)
  code = obfuscateStrings(code, decoderFuncName, shuffledCharset);

  // Step 5: Add junk code before and after
  const junkBefore = generateJunkCode(5);
  const junkAfter = generateJunkCode(5);

  // Step 6: Inject decoder in the middle of code
  code = insertMiddle(code, decoderCode);

  // Step 7: Assemble everything with watermark + junk + code
  let finalCode = watermark + junkBefore + '\n' + code + '\n' + junkAfter;

  // Step 8: Wrap lines in 'do ... end' if max security
  if (maxSecurity) {
    finalCode = finalCode.split('\n').map(line => line.trim() ? `do ${line.trim()} end` : '').join('\n');
  }

  // Output final obfuscated code
  document.getElementById("output").value = finalCode;

  // Create download link
  const blob = new Blob([finalCode], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'obfuscated.lua';
  downloadLink.textContent = 'Download obfuscated.lua';
  const downloadsDiv = document.getElementById('downloads');
  downloadsDiv.innerHTML = '';
  downloadsDiv.appendChild(downloadLink);

  // Optional: webhook send
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: finalCode }),
    }).then(res => {
      if (res.ok) alert('Sent to webhook!');
      else alert('Webhook failed!');
    }).catch(() => alert('Webhook error!'));
  }
});
