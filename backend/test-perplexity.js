const key = process.env.PERPLEXITY_API_KEY ||
  require('fs').readFileSync('.env.local', 'utf8')
    .match(/PERPLEXITY_API_KEY=(.+)/)?.[1]?.trim();

console.log("Using key prefix:", key?.slice(0, 12));

fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'sonar',
    messages: [{ role: 'user', content: 'I have a headache and fever' }],
    max_tokens: 200
  })
})
.then(r => {
  console.log("HTTP Status:", r.status);
  return r.json();
})
.then(d => console.log(JSON.stringify(d, null, 2)))
.catch(e => console.error('FETCH ERROR:', e));
