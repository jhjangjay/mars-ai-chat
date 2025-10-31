// api/chat.js
export default async function handler(req, res) {
  // ===== CORS =====
  const allowed = [
    'https://www.easoholding.com',
    'https://easoholding.com',
    'http://www.easoholding.com',   // 편의상 http도 임시 허용 (원하면 지우세요)
    'http://easoholding.com'
  ];
  const origin = req.headers.origin || '';
  const okOrigin = allowed.includes(origin) ? origin : allowed[0];

  res.setHeader('Access-Control-Allow-Origin', okOrigin);
  res.setHeader('Vary', 'Origin'); // 캐시 안전
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end(); // Preflight OK
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ===== JSON Body 파싱 (Edge/Node 모두 대응) =====
  let messages;
  try {
    if (req.body && typeof req.body === 'object') {
      messages = req.body.messages;
    } else {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const txt = Buffer.concat(chunks).toString('utf8') || '{}';
      const parsed = JSON.parse(txt);
      messages = parsed.messages;
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',   // 더 고급은 'gpt-4o'
        temperature: 0.7,
        messages
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'OpenAI error' });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
