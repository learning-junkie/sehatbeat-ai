async function test(label, symptoms, language) {
  const res = await fetch('http://localhost:3000/api/analyze-symptoms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, language, history: [] })
  });
  const data = await res.json();
  console.log(`\n[${label}] Status: ${res.status}`);
  console.log('  problem:', data.problem);
  console.log('  severityLevel:', data.severityLevel);
  console.log('  possibleCauses:', data.possibleCauses?.slice(0,2));
  console.log('  specialist:', data.specialist);
  console.log('  error:', data.error || '(none)');
}

(async () => {
  await test('English', 'I have a headache and fever since yesterday', 'en');
  await test('Hindi Script', 'मुझे सिरदर्द और बुखार है', 'hi');
  await test('Hinglish', 'mujhe bahut weakness feel ho rahi hai aur sir dard bhi hai', 'hi');
  await test('Off-topic', 'Who won the IPL 2024?', 'en');
})();
