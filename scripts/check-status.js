const path = require('path');
const { Pool } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const views = await pool.query(`
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  const triggers = await pool.query(`
    SELECT trigger_name, event_object_table 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
    GROUP BY trigger_name, event_object_table
    ORDER BY trigger_name;
  `);

  const customRoutines = await pool.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_type IN ('FUNCTION', 'PROCEDURE')
      AND routine_name NOT LIKE 'uuid_%'
      AND routine_name NOT LIKE 'btree_%'
      AND routine_name NOT LIKE 'gist_%'
    ORDER BY routine_name;
  `);

  console.log(`TOTAL_TABLES: ${tables.rows.length}`);
  console.log('TABLES:', tables.rows.map(r => r.table_name).join(', '));
  console.log(`TOTAL_VIEWS: ${views.rows.length}`);
  console.log('VIEWS:', views.rows.map(r => r.table_name).join(', '));
  console.log(`TOTAL_TRIGGERS: ${triggers.rows.length}`);
  console.log('TRIGGERS:', triggers.rows.map(r => `${r.trigger_name} (on ${r.event_object_table})`).join(', '));
  console.log(`CUSTOM_ROUTINES: ${customRoutines.rows.length}`);
  console.log('ROUTINES:', customRoutines.rows.map(r => r.routine_name).join(', '));

  const venueCount = await pool.query('SELECT count(*) FROM venues;');
  const auditCount = await pool.query('SELECT count(*) FROM audit_logs;');
  console.log(`VENUES_SEEDED: ${venueCount.rows[0].count}`);
  console.log(`AUDIT_LOGS_RECORDED: ${auditCount.rows[0].count}`);

  await pool.end();
}

main().catch(err => {
  console.error('Error checking status:', err);
  pool.end();
  process.exit(1);
});
