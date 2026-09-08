import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { buildApp } from './app';

async function main() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;
  const host = process.env.API_HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    app.log.info(`🚀 Festy API Server escuchando en http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
