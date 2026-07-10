const apiKey = process.env.FIREWORKS_API_KEY || 'no-key';
console.log('Testing with key:', apiKey ? 'present' : 'missing');
fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'accounts/fireworks/models/deepseek-v4-flash',
    max_tokens: 350,
    messages: [{role: 'user', content: 'test'}],
    response_format: { type: 'json_object' }
  })
}).then(r => r.text()).then(console.log).catch(console.error);
