// api/chat.js
export default async function handler(req, res) {
  // ------- CORS 허용 도메인(둘 다 넣기: 단/복수 도메인 + 아임웹 미리보기) -------
  const allowed = [
    'https://www.easoholding.com',
    'https://easoholding.com',
    'https://www.easoholdings.com',
    'https://easoholdings.com',
  ];
  const origin = req.headers.origin || '';
  const isImweb = /(\.imweb\.me|\.imweb\.co\.kr)$/i.test(origin); // 아임웹 미리보기 허용
  const okOrigin = (allowed.includes(origin) || isImweb) ? origin : '*';

  res.setHeader('Access-Control-Allow-Origin', okOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ---- JSON body ----
  let messages = req.body?.messages;
  if (!messages) {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      messages = JSON.parse(Buffer.concat(chunks).toString('utf8')).messages;
    } catch (_) {}
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
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'OpenAI error' });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
