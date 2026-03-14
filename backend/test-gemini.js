const fs = require('fs');
const key = fs.readFileSync('.env.local','utf8').match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

console.log("Gemini key prefix:", key?.slice(0, 15));

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "I have a headache. Reply with 3 words." }] }],
    generationConfig: { maxOutputTokens: 50 }
  })
})
.then(r => {
  console.log("Status:", r.status);
  return r.json();
})
.then(d => console.log(JSON.stringify(d, null, 2)))
.catch(e => console.error('ERROR:', e));
