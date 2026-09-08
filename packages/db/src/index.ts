import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export * from './schema';

let poolConnection: mysql.Pool | null = null;

export function getDbConnection(connectionUri?: string) {
  const uri = connectionUri || process.env.DATABASE_URL || 'mysql://root:rootpassword@127.0.0.1:4000/festy_db';
  
  if (!poolConnection) {
    const isTiDBCloud = uri.includes('tidbcloud.com');
    poolConnection = mysql.createPool({
      uri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ssl: isTiDBCloud
        ? {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
          }
        : undefined,
    });
  }

  return drizzle(poolConnection, { schema, mode: 'default' });
}

export type DbClient = ReturnType<typeof getDbConnection>;
