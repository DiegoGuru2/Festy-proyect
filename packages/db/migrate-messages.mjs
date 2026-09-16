import mysql from 'mysql2/promise';

async function createDirectMessagesTable() {
  const connection = await mysql.createConnection({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '4L2QahQaEGXYQ4z.root',
    password: 'XlWKGgz7CYuHygsN',
    database: 'festy_db',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  });

  console.log('✅ Conexión establecida con TiDB Cloud');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS direct_messages (
      id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      receiver_id VARCHAR(36) NOT NULL,
      circle_id VARCHAR(36) NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      read_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      PRIMARY KEY (id),
      INDEX idx_dm_conversation (sender_id, receiver_id, created_at),
      INDEX idx_dm_receiver_unread (receiver_id, is_read, deleted_at),
      INDEX idx_dm_circle (circle_id),
      CONSTRAINT fk_dm_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_dm_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_dm_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await connection.query(createTableSQL);
    console.log('🎉 Tabla direct_messages creada correctamente');
  } catch (err) {
    console.error('❌ Error creando tabla:', err.message);
  }

  // Verificar que la tabla existe
  const [rows] = await connection.query("SHOW TABLES LIKE 'direct_messages'");
  console.log('📋 Verificación:', rows.length > 0 ? 'Tabla existe ✅' : 'Tabla NO existe ❌');

  // Verificar si hay usuarios en círculos (para debugging)
  const [members] = await connection.query(`
    SELECT COUNT(DISTINCT cm.user_id) as total_users, COUNT(DISTINCT cm.circle_id) as total_circles
    FROM circle_members cm
    INNER JOIN circles c ON c.id = cm.circle_id
    WHERE c.deleted_at IS NULL
  `);
  console.log('👥 Usuarios en círculos:', members[0]);

  await connection.end();
}

createDirectMessagesTable().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
