const apiKey = process.env.FIREWORKS_API_KEY || 'no-key';
console.log('Testing with key:', apiKey ? 'present' : 'missing');
fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b',
    max_tokens: 350,
    messages: [{role: 'user', content: 'test'}],
    response_format: { type: 'json_object' }
  })
}).then(r => r.json()).then(data => {
  let content = data.choices[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  console.log(content);
}).catch(console.error);
