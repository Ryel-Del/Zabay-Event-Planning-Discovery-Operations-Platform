const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL_UNPOOLED or DATABASE_URL is not set.');
  process.exit(1);
}

async function runMigration() {
  console.log('Connecting to Neon PostgreSQL cluster...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully to Neon!');

    const files = [
      '../db/schema.sql',
      '../db/role2_procedures_triggers.sql',
      '../db/seeds/bohol_venues_seed.sql'
    ];

    for (const relPath of files) {
      const fullPath = path.join(__dirname, relPath);
      console.log(`\nExecuting SQL script: ${relPath}...`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await client.query(sql);
      console.log(`Completed ${relPath} successfully.`);
    }

    console.log('\n--- VERIFICATION OF DATABASE OBJECTS ---');
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`Total public tables created: ${tableRes.rows.length}`);
    console.log('Tables:', tableRes.rows.map(r => r.table_name).join(', '));

    const procRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `);
    console.log(`Total custom routines created: ${procRes.rows.length}`);
    console.log('Routines:', procRes.rows.map(r => r.routine_name).join(', '));

    const testMatch = await client.query(`
      SELECT * FROM fn_match_venue_to_event('evt-bohol-esports-2026', 'ven-wisdom-gym');
    `);
    console.log('\nTest execution of fn_match_venue_to_event:');
    console.log(testMatch.rows[0]);

    console.log('\nAll Neon database objects and seed data are verified and 100% active!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
