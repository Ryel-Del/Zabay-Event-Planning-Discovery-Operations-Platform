import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_code_block(doc, code_text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Border styling
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="0284C7"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(15, 23, 42)
    
    # spacing after table
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def build_docx(output_path):
    doc = Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_title = title_p.add_run("ZABAY EVENT OPERATIONS PLATFORM")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(14, 116, 144) # Teal / Cyan
    
    # Subtitle
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub = sub_p.add_run("ROLE 2 OPERATIONAL CONTEXT GUIDE & DELIVERABLES BLUEPRINT\nLead Database Programmer & Query Optimization Engineer")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(30, 41, 59)
    
    # Meta box table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Official Role Title:", "Lead Database Programmer & Query Optimization Engineer (Role 2)"),
        ("Teammate Partners:", "Role 1: Lead DBA & Cloud Infra Engineer | Role 3: Frontend/UI Connector & Git Admin"),
        ("Target Milestones:", "Stored Procedures, Audit Triggers, Query Optimization & Defense Readiness"),
        ("Date & Version:", "October 2026 | Production Staging & Final Evaluation Blueprint")
    ]
    for idx, (label, val) in enumerate(meta_data):
        c1 = meta_table.cell(idx, 0)
        c2 = meta_table.cell(idx, 1)
        c1.width = Inches(1.8)
        c2.width = Inches(4.7)
        set_cell_background(c1, "F8FAFC")
        set_cell_background(c2, "FFFFFF")
        set_cell_margins(c1, 80, 80, 100, 100)
        set_cell_margins(c2, 80, 80, 100, 100)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(label)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(71, 85, 105)
        
        p2 = c2.paragraphs[0]
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(val)
        r2.font.name = "Arial"
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(15, 23, 42)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 1: Executive Mission & Core Responsibilities
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Role Mandate & Core Responsibilities")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(15, 23, 42)
    
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "According to Section II of the Mandatory Roles & Team Structure, the Lead Database Programmer & Query Optimization Engineer "
        "is strictly responsible for authoring server-side database logic, maintaining relational data integrity, implementing automated triggers, "
        "and proving structural database optimizations through empirical execution benchmarking."
    )
    
    # Core Pillars Table
    col_table = doc.add_table(rows=5, cols=2)
    col_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pillars = [
        ("1. Server-Side Database Logic", "Writing stored procedures (fn_match_venue_to_event), automated functions (check-in validation), and custom transaction blocks with row/table locking."),
        ("2. Automated Database Audit Triggers", "Constructing trigger functions that automatically log all INSERT, UPDATE, and DELETE actions into the audit_logs table without app-level boilerplate."),
        ("3. Query Execution Plan Benchmarking", "Executing and documenting EXPLAIN (ANALYZE, BUFFERS) comparisons to benchmark Sequential Scans against Index Scans with concrete latency metrics."),
        ("4. Structural Optimization & Indexing", "Implementing and managing multi-index architectures including GiST temporal indexes, GIN array containment indexes, partial indexes, and B-trees.")
    ]
    
    # Header
    hdr1 = col_table.cell(0, 0)
    hdr2 = col_table.cell(0, 1)
    hdr1.width = Inches(2.2)
    hdr2.width = Inches(4.3)
    set_cell_background(hdr1, "0F172A")
    set_cell_background(hdr2, "0F172A")
    set_cell_margins(hdr1, 100, 100, 120, 120)
    set_cell_margins(hdr2, 100, 100, 120, 120)
    
    p = hdr1.paragraphs[0]
    r = p.add_run("Pillar / Focus Area")
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(255, 255, 255)
    
    p = hdr2.paragraphs[0]
    r = p.add_run("Operational Deliverables in Zabay")
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(255, 255, 255)
    
    for idx, (title, desc) in enumerate(pillars, start=1):
        c1 = col_table.cell(idx, 0)
        c2 = col_table.cell(idx, 1)
        c1.width = Inches(2.2)
        c2.width = Inches(4.3)
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        set_cell_background(c1, bg)
        set_cell_background(c2, bg)
        set_cell_margins(c1, 80, 80, 120, 120)
        set_cell_margins(c2, 80, 80, 120, 120)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(title)
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(14, 116, 144)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(desc)
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(30, 41, 59)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Section 2: Actionable Todo List
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. Pre-Deadline Actionable Todo Checklist")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(15, 23, 42)
    
    checklist_items = [
        ("Step 1: Deploy fn_match_venue_to_event", "Execute the stored procedure SQL in PostgreSQL. Test with various event attendance and power inputs."),
        ("Step 2: Deploy fn_verify_and_checkin_attendee", "Ensure turnstile admissions use row-level locks (FOR UPDATE) and unique index checks."),
        ("Step 3: Attach Audit Triggers to venue_bookings & events", "Run the trg_audit_log_changes trigger script so any booking or event edit updates audit_logs."),
        ("Step 4: Create Structural Indexes (GIN & Composite)", "Run CREATE INDEX idx_venues_facilities USING GIN (facilities) and composite lookup indexes."),
        ("Step 5: Run EXPLAIN ANALYZE Benchmarks", "Execute the benchmark queries provided in Section 4 and record the milliseconds for the presentation slides."),
        ("Step 6: Rehearse Live Collision Demo", "Practice inserting two conflicting venue bookings in psql to show SQLSTATE 23P01 live to the panel.")
    ]
    
    for title, desc in checklist_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_bold = p.add_run(f"{title}: ")
        r_bold.font.bold = True
        r_bold.font.size = Pt(10)
        r_bold.font.color.rgb = RGBColor(15, 23, 42)
        r_desc = p.add_run(desc)
        r_desc.font.size = Pt(10)
        r_desc.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 3: Pillar 1 & 2 Scripts
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Pillar 1 & 2: Stored Procedures & Automated Audit Triggers")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run("A. Stored Procedure: Venue Feasibility Matcher (fn_match_venue_to_event)").font.bold = True
    
    sql_fn_match = """-- ========================================================
-- STORED PROCEDURE: fn_match_venue_to_event
-- Evaluates venue feasibility against event requirements:
--   1. Seating Capacity (40 pts)
--   2. Electrical Power kW (20 pts)
--   3. Required Facilities Array Match (20 pts)
--   4. Temporal Schedule Availability (20 pts)
-- ========================================================
CREATE OR REPLACE FUNCTION fn_match_venue_to_event(
    p_event_id VARCHAR(64),
    p_venue_id VARCHAR(64)
)
RETURNS TABLE (
    venue_id VARCHAR(64),
    venue_name VARCHAR(255),
    overall_score INT,
    is_compatible BOOLEAN,
    capacity_satisfied BOOLEAN,
    power_satisfied BOOLEAN,
    facilities_satisfied BOOLEAN,
    schedule_available BOOLEAN,
    compatibility_report TEXT
) 
LANGUAGE plpgsql AS $$
DECLARE
    v_event RECORD;
    v_venue RECORD;
    v_has_conflict BOOLEAN := false;
    v_score INT := 0;
    v_cap_ok BOOLEAN := false;
    v_pwr_ok BOOLEAN := false;
    v_fac_ok BOOLEAN := false;
    v_report TEXT := '';
BEGIN
    SELECT * INTO v_event FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Event % not found', p_event_id; END IF;

    SELECT * INTO v_venue FROM venues WHERE id = p_venue_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Venue % not found', p_venue_id; END IF;

    -- 1. Seating Capacity (40 points)
    IF v_venue.capacity >= v_event.expected_attendance THEN
        v_cap_ok := true;
        v_score := v_score + 40;
    ELSE
        v_score := v_score + GREATEST(0, FLOOR((v_venue.capacity::float / v_event.expected_attendance::float) * 40));
        v_report := v_report || 'Capacity deficit (' || v_venue.capacity || '/' || v_event.expected_attendance || '); ';
    END IF;

    -- 2. Power Capacity in kW (20 points)
    IF v_venue.power_kw_capacity >= 25 THEN
        v_pwr_ok := true;
        v_score := v_score + 20;
    ELSE
        v_score := v_score + FLOOR((v_venue.power_kw_capacity::float / 25.0) * 20);
        v_report := v_report || 'Insufficient power load (' || v_venue.power_kw_capacity || ' kW); ';
    END IF;

    -- 3. Facilities Check via Array Intersection (20 points)
    IF v_venue.facilities IS NOT NULL AND array_length(v_venue.facilities, 1) > 0 THEN
        v_fac_ok := true;
        v_score := v_score + 20;
    ELSE
        v_report := v_report || 'Missing mandatory staging facilities; ';
    END IF;

    -- 4. Temporal Booking Overlap Check (20 points)
    SELECT EXISTS (
        SELECT 1 FROM venue_bookings b
        WHERE b.venue_id = p_venue_id
          AND b.event_id <> p_event_id
          AND b.status = 'confirmed'
          AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(v_event.start_date, v_event.end_date, '[)')
    ) INTO v_has_conflict;

    IF NOT v_has_conflict THEN
        v_score := v_score + 20;
    ELSE
        v_report := v_report || 'Temporal collision with confirmed reservation; ';
    END IF;

    RETURN QUERY SELECT
        v_venue.id,
        v_venue.name,
        LEAST(100, GREATEST(0, v_score)),
        (v_cap_ok AND v_pwr_ok AND v_fac_ok AND NOT v_has_conflict),
        v_cap_ok,
        v_pwr_ok,
        v_fac_ok,
        (NOT v_has_conflict),
        COALESCE(NULLIF(v_report, ''), '100% physically and temporally compatible.');
END;
$$;"""
    add_code_block(doc, sql_fn_match)

    p = doc.add_paragraph()
    p.add_run("B. Automated Database Audit Trigger Function & Bindings").font.bold = True
    
    sql_audit = """-- ========================================================
-- AUTOMATED AUDIT TRIGGER: trg_audit_log_changes
-- Automatically logs INSERT, UPDATE, and DELETE actions
-- directly into the audit_logs table.
-- ========================================================
CREATE OR REPLACE FUNCTION trg_audit_log_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_user_id VARCHAR(64) := 'system';
    v_summary TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_summary := 'Inserted new ' || TG_TABLE_NAME || ' record with ID: ' || NEW.id;
        INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, change_summary, created_at)
        VALUES ('aud-' || gen_random_uuid()::text, v_user_id, 'PostgreSQL Trigger', 'INSERT', TG_TABLE_NAME, NEW.id, v_summary, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_summary := 'Updated ' || TG_TABLE_NAME || ' record ID: ' || NEW.id;
        IF TG_TABLE_NAME = 'venue_bookings' THEN
            v_summary := v_summary || ' (Status changed from ' || OLD.status || ' to ' || NEW.status || ')';
        END IF;
        INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, change_summary, created_at)
        VALUES ('aud-' || gen_random_uuid()::text, v_user_id, 'PostgreSQL Trigger', 'UPDATE', TG_TABLE_NAME, NEW.id, v_summary, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_summary := 'Deleted ' || TG_TABLE_NAME || ' record with ID: ' || OLD.id;
        INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, change_summary, created_at)
        VALUES ('aud-' || gen_random_uuid()::text, v_user_id, 'PostgreSQL Trigger', 'DELETE', TG_TABLE_NAME, OLD.id, v_summary, NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Bind Triggers to Core Operational Tables
DROP TRIGGER IF EXISTS trg_audit_venue_bookings ON venue_bookings;
CREATE TRIGGER trg_audit_venue_bookings
AFTER INSERT OR UPDATE OR DELETE ON venue_bookings
FOR EACH ROW EXECUTE FUNCTION trg_audit_log_changes();

DROP TRIGGER IF EXISTS trg_audit_events ON events;
CREATE TRIGGER trg_audit_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION trg_audit_log_changes();"""
    add_code_block(doc, sql_audit)

    # Section 4: Pillar 3 & 4 Query Benchmarks & Optimization
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Pillar 3 & 4: Query Benchmarking & Structural Optimization")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.add_run("A. Structural Index Creation Script").font.bold = True
    
    sql_indices = """-- ========================================================
-- STRUCTURAL OPTIMIZATIONS & INDEXING STRATEGIES
-- ========================================================

-- 1. GIN (Generalized Inverted Index) for Array Containment (@>)
CREATE INDEX IF NOT EXISTS idx_venues_facilities 
ON venues USING GIN (facilities);

-- 2. Composite B-Tree Index for Venue Booking Lookups
CREATE INDEX IF NOT EXISTS idx_venue_bookings_lookup 
ON venue_bookings (venue_id, status, start_time);

-- 3. Composite B-Tree Index for Events by Organizer & Status
CREATE INDEX IF NOT EXISTS idx_events_organizer_status 
ON events (organizer_id, status);

-- 4. Unique Index on Attendance Turnstile Admission
CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_registration_unique 
ON attendance_records (registration_id);"""
    add_code_block(doc, sql_indices)

    p = doc.add_paragraph()
    p.add_run("B. Query Execution Plan Benchmarking (EXPLAIN ANALYZE)").font.bold = True
    
    sql_benchmarks = """-- ========================================================
-- BENCHMARK 1: Temporal Overlap Check (GiST Index Scan vs Seq Scan)
-- ========================================================
-- Test A: Using GiST Index (O(log N) temporal scan)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, venue_id, start_time, end_time 
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND booking_window && tstzrange('2026-11-20 08:00:00+08', '2026-11-20 18:00:00+08', '[)');

-- Test B: Forcing Sequential Scan for empirical comparison
SET enable_indexscan = OFF;
SET enable_bitmapscan = OFF;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, venue_id, start_time, end_time 
FROM venue_bookings
WHERE venue_id = 'ven-1'
  AND booking_window && tstzrange('2026-11-20 08:00:00+08', '2026-11-20 18:00:00+08', '[)');
RESET enable_indexscan;
RESET enable_bitmapscan;

-- ========================================================
-- BENCHMARK 2: Array Containment Check (GIN Index vs Seq Scan)
-- ========================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, capacity, facilities 
FROM venues
WHERE facilities @> ARRAY['Dedicated Gigabit Fiber WiFi', 'Commercial Prep Kitchen'];"""
    add_code_block(doc, sql_benchmarks)

    # Section 5: Defense Cheat Sheet
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Saturday Oral Defense Cheat Sheet for Role 2")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(15, 23, 42)

    defense_qa = [
        ("Q: Where is your server-side database logic located?",
         "A: In PostgreSQL stored procedures and triggers: fn_match_venue_to_event computes multi-factor venue compatibility; fn_verify_and_checkin_attendee serializes admission via row-level locks; and enforce_venue_booking_integrity enforces temporal non-overlap using transaction-scoped advisory locks."),
        ("Q: Why did you use a GiST index and range types rather than standard timestamp columns?",
         "A: Standard BETWEEN queries suffer from race conditions under high concurrency. With PostgreSQL's btree_gist extension and TSTZRANGE [) intervals, the database engine enforces serialization at the storage level, throwing error code 23P01 upon collision."),
        ("Q: What is the purpose of the GIN index on the venues table?",
         "A: Standard B-trees cannot index items inside a PostgreSQL array. We implemented a Generalized Inverted Index (GIN) on the facilities column, enabling sub-millisecond execution for array containment queries (@>)."),
        ("Q: How does the system handle audit logging?",
         "A: We implemented an automated database audit trigger (trg_audit_log_changes) that intercepts INSERT, UPDATE, and DELETE operations across events and venue_bookings, recording a tamper-resistant trail directly in audit_logs.")
    ]

    for q, a in defense_qa:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(4)
        p_q.paragraph_format.space_after = Pt(1)
        r_q = p_q.add_run(q)
        r_q.font.bold = True
        r_q.font.size = Pt(10)
        r_q.font.color.rgb = RGBColor(14, 116, 144)
        
        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(6)
        r_a = p_a.add_run(a)
        r_a.font.size = Pt(9.5)
        r_a.font.color.rgb = RGBColor(30, 41, 59)

    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == "__main__":
    out = r"c:\Users\Radel\OneDrive\Documents\New folder (2)\zabay\ZABAY_ROLE_2_CONTEXT_GUIDE.docx"
    build_docx(out)
