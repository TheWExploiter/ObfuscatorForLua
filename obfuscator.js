function randomString(length = 15) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function base64Encode(str) {
    return btoa(str);
}

function base64Decode(str) {
    return atob(str);
}

function xorEncryptDecrypt(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return result;
}

function insertHiddenTrashCode(lines = 99) {
    let trash = '';
    for (let i = 0; i < lines; i++) {
        const rand = randomString();
        // Insert hidden, non-executing code in the form of seemingly functional operations
        trash += `local ${rand} = function() end; `;
        trash += `local ${rand}_ = ${rand}(); `;
        trash += `if not ${rand}_ then end; `;
    }
    return trash;
}

function insertConfusionCode(lines = 15) {
    let conf = '';
    for (let i = 0; i < lines; i++) {
        const var1 = randomString();
        const var2 = randomString();
        conf += `local ${var1} = function() return ${Math.floor(Math.random() * 500)} end; `;
        conf += `local ${var2} = ${var1}(); `;
        conf += `if ${var2} == ${Math.floor(Math.random() * 1000)} then end; `;
    }
    return conf;
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
    const head = '-- This File Was Protected By Cats Obfuscator V1\n\n';
    const trash = insertHiddenTrashCode(99);
    const confusion = insertConfusionCode(15);
    const renamed = renameVariablesDeep(code);
    const xorKey = Math.floor(Math.random() * 255); // Random XOR key
    const xorEncryptedCode = xorEncryptDecrypt(renamed, xorKey);
    const base64Encoded = base64Encode(xorEncryptedCode);
    
    const finalCode = `
--[[
Obfuscator V3.2
]]
${head}
${trash}
-- Base64 Encoded XOR Encrypted Code:
local decoded = base64Decode("${base64Encoded}")
local decrypted = xorEncryptDecrypt(decoded, ${xorKey})
loadstring(decrypted)()
${confusion}
`;

    return finalCode;
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
        content: 'New Lua Obfuscation',
        embeds: [
            {
                title: 'Original Code',
                description: 'lua\n' + original.slice(0, 1900) + '\n'
            },
            {
                title: 'Obfuscated Code',
                description: 'lua\n' + obfuscated.slice(0, 1900) + '\n'
            }
        ]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
