// api/proxy.js
// Vercel serverless function to proxy requests to the backend, avoiding CORS.
// Usage from frontend: fetch('/api/proxy/<path>', ...)

export default async function handler(req, res) {
  try {
    const backendBase = 'https://hsoftworks.vercel.app';
    // Preserve original path and query after /api/proxy
    const originalUrl = req.url || '';
    const targetPath = originalUrl.replace(/^\/api\/proxy/, '') || '/';
    const targetUrl = backendBase + targetPath;

    // Build headers: forward essential headers including cookies and auth
    const inbound = req.headers || {};
    const headers = new Headers();
    const passHeaders = [
      'content-type',
      'authorization',
      'x-seller-id',
      'cookie',
    ];
    passHeaders.forEach((h) => {
      const v = inbound[h] || inbound[h.toLowerCase()];
      if (v) headers.set(h, Array.isArray(v) ? v.join('; ') : String(v));
    });

    // Prepare body: only for non-GET/HEAD
    let body;
    const method = (req.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(method)) {
      // If content-type is JSON and body is an object, stringify it
      const ct = (inbound['content-type'] || inbound['Content-Type'] || '').toString();
      if (ct.includes('application/json') && req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        headers.set('content-type', 'application/json');
      } else if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        body = req.body;
      } else {
        // As a fallback, try to read raw body from the request stream
        body = await new Promise((resolve, reject) => {
          try {
            let chunks = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', () => resolve(Buffer.concat(chunks)));
            req.on('error', reject);
          } catch (e) { resolve(undefined); }
        });
      }
    }

    const resp = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    // Forward status and selected headers
    res.status(resp.status);

    // Pass through important headers for downloads and JSON
    const contentType = resp.headers.get('content-type');
    const contentDisposition = resp.headers.get('content-disposition');
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    // Forward Set-Cookie (may be multiple) and normalize attributes for first-party usage
    const setCookie = resp.headers.get('set-cookie');
    if (setCookie) {
      // Split consolidated Set-Cookie header into individual cookies
      const cookiesRaw = Array.isArray(setCookie) ? setCookie : setCookie.split(/,(?=\s*[^;=]+?=)/g);
      const rewritten = cookiesRaw.map((c) => {
        let out = String(c);
        // Remove Domain to bind cookie to current host
        out = out.replace(/;\s*Domain=[^;]+/ig, '');
        // Ensure Path=/ for broader scope
        if (!/;\s*Path=/i.test(out)) out += '; Path=/';
        // If SameSite=None, ensure Secure (Vercel serves over HTTPS)
        if (/;\s*SameSite=None/i.test(out) && !/;\s*Secure/i.test(out)) out += '; Secure';
        return out;
      });
      res.setHeader('Set-Cookie', rewritten);
    }

    const arrayBuf = await resp.arrayBuffer();
    res.send(Buffer.from(arrayBuf));
  } catch (err) {
    res.status(502).json({ success: false, message: 'Proxy error', error: String(err && err.message ? err.message : err) });
  }
}
