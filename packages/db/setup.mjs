import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSetup() {
  const connection = await mysql.createConnection({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '4L2QahQaEGXYQ4z.root',
    password: 'XlWKGgz7CYuHygsN',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    multipleStatements: true,
  });

  console.log('✅ Conexión establecida');

  const sqlScriptPath = path.join(__dirname, 'setup-tidb.sql');
  const sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');

  // Separar y ejecutar sentencia por sentencia para atrapar el error exacto
  const statements = sqlScript
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await connection.query(stmt);
      const firstLine = stmt.split('\n')[0].substring(0, 60);
      console.log(`[${i + 1}/${statements.length}] OK: ${firstLine}...`);
    } catch (err) {
      console.error(`❌ Error en sentencia [${i + 1}/${statements.length}]:`);
      console.error('SQL:', stmt);
      console.error('Mensaje de error:', err.message);
      process.exit(1);
    }
  }

  console.log('🎉 ¡Todas las sentencias se ejecutaron correctamente!');
  await connection.end();
}

runSetup().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
