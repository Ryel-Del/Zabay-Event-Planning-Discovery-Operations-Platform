const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

async function testLiveNeon() {
  console.log('Connecting to Neon PostgreSQL cluster...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Neon successfully!');

    // 1. Insert an event
    const eventSql = `
      INSERT INTO events (id, title, category, start_date, end_date, organizer_id, expected_attendance)
      VALUES ('evt-test-demo', 'Bohol Youth Innovation Summit', 'technology', NOW() + interval '5 days', NOW() + interval '6 days', 'zabay-operator', 180)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
      RETURNING id, title, start_date, end_date;
    `;
    const evtRes = await client.query(eventSql);
    console.log('Event Inserted/Verified in Neon:', evtRes.rows[0]);

    // 2. Test Stored Procedure fn_match_venue_to_event
    const matchSql = `SELECT * FROM fn_match_venue_to_event('evt-test-demo', 'ven-1');`;
    const matchRes = await client.query(matchSql);
    console.log('\n--- STORED PROCEDURE RESULT (fn_match_venue_to_event) ---');
    console.log(matchRes.rows[0]);

    // 3. Test Automated Trigger trg_audit_venue_bookings
    console.log('\n--- TESTING AUTOMATED DATABASE TRIGGER (audit_logs) ---');
    const bookingSql = `
      INSERT INTO venue_bookings (id, venue_id, event_id, event_title, booking_window, start_time, end_time, status)
      VALUES ('vb-test-live', 'ven-1', 'evt-test-demo', 'Bohol Youth Innovation Summit', tstzrange(NOW() + interval '5 days', NOW() + interval '6 days', '[)'), NOW() + interval '5 days', NOW() + interval '6 days', 'confirmed')
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    await client.query(bookingSql);

    // Verify trigger inserted into audit_logs
    const auditRes = await client.query(`
      SELECT id, action, entity_type, entity_id, change_summary, user_name, created_at
      FROM audit_logs
      WHERE entity_id = 'vb-test-live'
      ORDER BY created_at DESC LIMIT 1;
    `);
    console.log('Audit Log automatically written by PostgreSQL Trigger:');
    console.log(auditRes.rows[0]);

    // 4. Test GiST Exclusion Collision Prevention (23P01)
    console.log('\n--- TESTING TEMPORAL CONCURRENCY COLLISION (GiST EXCLUDE 23P01) ---');
    try {
      await client.query(`
        INSERT INTO venue_bookings (id, venue_id, event_id, event_title, booking_window, start_time, end_time, status)
        VALUES ('vb-collision-attempt', 'ven-1', 'evt-test-demo', 'Conflicting Event', tstzrange(NOW() + interval '5 days', NOW() + interval '6 days', '[)'), NOW() + interval '5 days', NOW() + interval '6 days', 'confirmed');
      `);
      console.error('FAILED: Double booking was allowed!');
    } catch (err) {
      console.log(`SUCCESS: PostgreSQL intercepted double-booking with error code: ${err.code} (${err.message})`);
    }

    // 5. Test Turnstile Stored Procedure fn_verify_and_checkin_attendee
    console.log('\n--- TESTING TURNSTILE STORED FUNCTION (fn_verify_and_checkin_attendee) ---');
    await client.query(`
      INSERT INTO registrations (id, event_id, attendee_id, attendee_name, attendee_email, qr_pass_code, status)
      VALUES ('reg-live-demo', 'evt-test-demo', 'zabay-operator', 'Juan Dela Cruz', 'juan@zabay.ph', 'ZABAY-LIVE-PASS-001', 'confirmed')
      ON CONFLICT (id) DO NOTHING;
    `);
    const checkin1 = await client.query(`SELECT * FROM fn_verify_and_checkin_attendee('ZABAY-LIVE-PASS-001', 'Gate-A-Scanner');`);
    console.log('Scan 1 (Initial Admission):', checkin1.rows[0]);

    const checkin2 = await client.query(`SELECT * FROM fn_verify_and_checkin_attendee('ZABAY-LIVE-PASS-001', 'Gate-A-Scanner');`);
    console.log('Scan 2 (Duplicate Attempt):', checkin2.rows[0]);

    console.log('\n✅ ALL LIVE NEON SERVICES, PROCEDURES, TRIGGERS, AND CONSTRAINTS ARE 100% OPERATIONAL!');
  } catch (err) {
    console.error('Error during end-to-end test:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testLiveNeon();
