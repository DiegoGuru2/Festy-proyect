export default async function handler(req: any, res: any) {
  // Test directo de endpoint
  if (req.url === '/ping') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'pong', time: new Date().toISOString() }));
  }

  try {
    // Dynamic import to catch any module resolution / initialization errors
    // @ts-ignore
    const { buildApp } = await import('../apps/api/dist/app.js');
    const app = await buildApp();

    await app.ready();

    // Normalizar URL
    const originalUrl = req.headers['x-matched-path'] || req.url;
    if (req.url === '/api' || req.url === '/api/index') {
      req.url = originalUrl;
    }

    return new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app.server.emit('request', req, res);
    });
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Fastify Boot Error',
      message: err?.message,
      stack: err?.stack,
    }));
  }
}
