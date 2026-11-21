const forwardedHeaders = [
  'Accept',
  'Authorization',
  'Content-Type',
  'If-Modified-Since',
  'If-None-Match',
  'Range',
  'X-Cart-Session',
  'X-Guest-Cart-Token',
];

const apiResponseHeaders = {
  'Cache-Control': 'private, no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox",
  'X-Content-Type-Options': 'nosniff',
};
const sessionCookieName = '__Host-webshop-session';
const cookieAttributes = 'Path=/; HttpOnly; Secure; SameSite=Strict';

function readSession(accessToken) {
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(accessToken ?? '')) return null;
  try {
    const [, payload] = accessToken.split('.');
    const bytes = Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) return null;

    const role = claims.role ?? claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return {
      accessTokenExpiresAtUtc: new Date(claims.exp * 1000).toISOString(),
      username: String(claims.unique_name ?? claims.name ?? claims.sub ?? ''),
      roles: [role].flat().filter(value => ['Admin', 'Manager', 'Seller', 'Buyer'].includes(value)),
    };
  } catch {
    return null;
  }
}

function unavailable() {
  return Response.json({ title: 'Backend unavailable' }, { status: 502, headers: apiResponseHeaders });
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (incoming.pathname !== '/health' && incoming.pathname !== '/health/ready' && incoming.pathname !== '/api' && !incoming.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const path = incoming.pathname.toLowerCase().replace(/\/+$/, '');
    const isLogin = path === '/api/auth/login' && request.method === 'POST';
    const cookie = request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-webshop-session=([\w.-]+)(?:;|$)/)?.[1];
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const isSession = path === '/api/session';
    if (isMutation && (cookie || isLogin || isSession) && request.headers.get('Origin') !== incoming.origin) {
      return new Response(null, { status: 403, headers: apiResponseHeaders });
    }

    if (isSession) {
      if (request.method === 'GET') return Response.json(readSession(cookie), { headers: apiResponseHeaders });
      if (request.method === 'DELETE') {
        return new Response(null, {
          status: 204,
          headers: { ...apiResponseHeaders, 'Set-Cookie': `${sessionCookieName}=; Max-Age=0; ${cookieAttributes}` },
        });
      }
      return new Response(null, { status: 405, headers: { ...apiResponseHeaders, Allow: 'GET, DELETE' } });
    }

    const upstream = new URL(env.API_ORIGIN);
    upstream.pathname = incoming.pathname;
    upstream.search = incoming.search;

    const headers = new Headers();
    for (const name of forwardedHeaders) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    if (cookie && !isLogin && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${cookie}`);

    try {
      const response = await fetch(upstream, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(60_000),
      });

      if (response.status >= 300 && response.status < 400 && response.status !== 304) {
        await response.body?.cancel();
        return unavailable();
      }

      if (isLogin && response.ok) {
        const { accessToken } = await response.json();
        const session = readSession(accessToken);
        if (!session) return unavailable();

        const maxAge = Math.max(0, Math.floor((Date.parse(session.accessTokenExpiresAtUtc) - Date.now()) / 1000));
        return Response.json(session, {
          headers: { ...apiResponseHeaders, 'Set-Cookie': `${sessionCookieName}=${accessToken}; Max-Age=${maxAge}; ${cookieAttributes}` },
        });
      }

      const result = new Response(response.body, response);
      for (const [name, value] of Object.entries(apiResponseHeaders)) {
        result.headers.set(name, value);
      }
      result.headers.delete('Set-Cookie');
      return result;
    } catch {
      return unavailable();
    }
  },
};
