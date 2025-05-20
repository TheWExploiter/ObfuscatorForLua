document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputCode");
  const output = document.getElementById("output");
  const obfuscateBtn = document.getElementById("obfuscateBtn");
  const webhookUrl = document.getElementById("webhookUrl");
  const downloads = document.getElementById("downloads");

  const watermark = "--[[) This File Has Been Obfuscated By Lua Obfuscator V3 (]]--";

  function shuffleString(str) {
    const arr = str.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }

  function getRandomCharset() {
    return shuffleString("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=");
  }

  function b64EncodeUnicode(str, charset) {
    const btoaEncoded = btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode("0x" + p1)
      )
    );
    return btoaEncoded
      .split("")
      .map((c) =>
        charset.includes(c)
          ? charset.indexOf(c).toString(16).padStart(2, "0")
          : c
      )
      .join("");
  }

  function randomVar(length = 12) {
    const chars = shuffleString("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateJunk(count = 5) {
    const junk = [];
    for (let i = 0; i < count; i++) {
      const varName = randomVar();
      const val = Math.floor(Math.random() * 999999);
      junk.push(`local ${varName} = ${val}`);
    }
    return junk.join("\n");
  }

  function generateFakeFunc() {
    const fname = randomVar();
    const v = randomVar();
    return `local function ${fname}()\n  local ${v} = 0\n  for i=1,10 do ${v} = ${v} + i end\n  return ${v}\nend;`;
  }

  function createDecodeChain(encoded, levels = 4) {
    let layered = encoded;
    for (let i = 0; i < levels; i++) {
      layered = btoa(layered);
    }
    return layered;
  }

  function obfuscateLua(code) {
    const encoded = createDecodeChain(code, 4);
    const lvar = randomVar();
    const decodeFunc = randomVar();
    const executeFunc = randomVar();
    const junkCode = generateJunk();
    const fakeFunc = generateFakeFunc();

    return `${watermark}\n\n${junkCode}\n\n${fakeFunc}\n\nlocal ${lvar} = '${encoded}'\n\nlocal function ${decodeFunc}(s)\n  for i = 1, 4 do\n    s = s:gsub('[^A-Za-z0-9+/=]', '')\n    s = (s:gsub('.', function(x)\n      if (x == '=') then return '' end\n      local r, f = '', (('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'):find(x)-1)\n      for i=6,1,-1 do\n        r = r .. (f % 2^i - f % 2^(i-1) > 0 and '1' or '0')\n      end\n      return r\n    end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)\n      if (#x ~= 8) then return '' end\n      local c = 0\n      for i = 1, 8 do\n        c = c + (x:sub(i, i) == '1' and 2^(8 - i) or 0)\n      end\n      return string.char(c)\n    end))\n  end\n  return s\nend\n\nlocal function ${executeFunc}()\n  local chunk = loadstring(${decodeFunc}(${lvar}))\n  if chunk then chunk() end\nend\n\nif os.clock() > 0 then ${executeFunc}() end`;
  }

  obfuscateBtn.addEventListener("click", () => {
    const code = input.value.trim();
    if (!code) return alert("Paste some Lua code!");

    const obfuscated = obfuscateLua(code);
    output.value = obfuscated;

    const file = new Blob([obfuscated], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    downloads.innerHTML = `<a href="${url}" download="obfuscated.lua">Download Obfuscated File</a>`;

    const wh = webhookUrl.value.trim();
    if (wh) {
      fetch(wh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "```lua\n" + obfuscated + "\n```",
        }),
      });
    }
  });
});
