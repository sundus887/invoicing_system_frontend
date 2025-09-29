// api/proxy.js
// Vercel serverless function to proxy requests to the backend, avoiding CORS.
// Usage from frontend: fetch('/api/proxy/<path>', ...)

export default async function handler(req, res) {
  try {
    const baseBackend = 'https://hsoftworks.vercel.app';
    const originalUrl = req.url || '';
    const targetPath = originalUrl.replace(/^\/api\/proxy/, '') || '/';
    const targetUrl = baseBackend + targetPath;

    // Clone inbound headers, drop hop-by-hop and host/content-length
    const inbound = { ...(req.headers || {}) };
    delete inbound.host;
    delete inbound['content-length'];
    delete inbound.connection;

    // Build fetch headers (only forward what the backend needs)
    const headers = new Headers();
    const passHeaders = ['content-type', 'authorization', 'x-seller-id', 'cookie'];
    passHeaders.forEach((h) => {
      const v = inbound[h] || inbound[h.toLowerCase()];
      if (v) headers.set(h, Array.isArray(v) ? v.join('; ') : String(v));
    });

    // Request method and body
    const method = (req.method || 'GET').toUpperCase();
    let body;
    if (!['GET', 'HEAD'].includes(method)) {
      const ct = (inbound['content-type'] || inbound['Content-Type'] || '').toString();
      if (ct.includes('application/json')) {
        // Vercel parses req.body for us when JSON
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
        headers.set('content-type', 'application/json');
      } else if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        body = req.body;
      } else {
        // Fallback: read raw stream
        body = await new Promise((resolve) => {
          try {
            const chunks = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', () => resolve(Buffer.concat(chunks)));
            req.on('error', () => resolve(undefined));
          } catch {
            resolve(undefined);
          }
        });
      }
    }

    const upstream = await fetch(targetUrl, { method, headers, body });

    // Mirror important headers
    const contentType = upstream.headers.get('content-type');
    const contentDisposition = upstream.headers.get('content-disposition');
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    // Normalize Set-Cookie for first-party
    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) {
      const cookiesRaw = Array.isArray(setCookie) ? setCookie : setCookie.split(/,(?=\s*[^;=]+?=)/g);
      const rewritten = cookiesRaw.map((c) => {
        let out = String(c);
        out = out.replace(/;\s*Domain=[^;]+/ig, '');
        if (!/;\s*Path=/i.test(out)) out += '; Path=/';
        if (/;\s*SameSite=None/i.test(out) && !/;\s*Secure/i.test(out)) out += '; Secure';
        return out;
      });
      res.setHeader('Set-Cookie', rewritten);
    }

    // Status + body passthrough
    res.status(upstream.status);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err) {
    console.error('Proxy error:', err && (err.stack || err.message || err));
    res.status(500).json({ success: false, message: 'Proxy error', detail: String(err && err.message ? err.message : err) });
  }
}
