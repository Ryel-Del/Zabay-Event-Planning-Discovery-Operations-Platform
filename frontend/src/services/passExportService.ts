import type { Registration, ZabayEvent, Venue } from '../types';

/**
 * Service for printing and saving Zabay Event Passes as high-resolution PNG images.
 */

interface PassDetails {
  registration: Registration;
  event?: ZabayEvent;
  venue?: Venue;
}

/**
 * Generates and downloads a high-resolution PNG pass card image (1000x560).
 */
export async function downloadPassAsImage({ registration, event, venue }: PassDetails): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border & soft shadow
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Left Section Header Banner (Bohol Sea Blue Gradient)
  const headerGrad = ctx.createLinearGradient(10, 10, 700, 10);
  headerGrad.addColorStop(0, '#1E3A8A'); // Deep Navy
  headerGrad.addColorStop(1, '#3E6CB5'); // Bohol Sea Blue
  ctx.fillStyle = headerGrad;
  ctx.fillRect(10, 10, 690, 80);

  // Zabay Branding
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ZABAY EVENT OPERATIONS', 36, 46);

  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#BAE6FD';
  ctx.fillText('OFFICIAL DIGITAL ADMISSION PASS • BOHOL, PHILIPPINES', 36, 68);

  // Security Badge (Right corner of header)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(500, 26, 180, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('✓ VERIFIED ADMISSION', 516, 44);

  // Event Details
  const eventTitle = event?.title || registration.event_title || 'Sandugo Bohol Youth Summit 2026';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  // Truncate event title if too long
  const truncatedTitle = eventTitle.length > 42 ? eventTitle.substring(0, 40) + '...' : eventTitle;
  ctx.fillText(truncatedTitle, 36, 130);

  // Category & Format Pill
  const category = event?.category || 'Championship Tournament';
  ctx.fillStyle = '#EBF3FC';
  ctx.beginPath();
  ctx.roundRect(36, 146, 200, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#244A85';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(category.toUpperCase(), 48, 162);

  // Date & Venue Details
  ctx.fillStyle = '#475569';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'Friday, November 20, 2026';
  ctx.fillText(`📅  Date: ${eventDate}`, 36, 202);

  const venueName = venue?.name || 'Bohol Wisdom School Gymnasium';
  const venueAddress = venue?.address || 'CPG North Avenue, Tagbilaran City, Bohol';
  ctx.fillText(`📍  Venue: ${venueName}`, 36, 230);
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(`     ${venueAddress}`, 36, 252);

  // Horizontal Divider Line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 280);
  ctx.lineTo(670, 280);
  ctx.stroke();

  // Attendee Credentials
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PASS HOLDER / ATTENDEE', 36, 310);
  ctx.fillText('TICKET TIER / ACCESS LEVEL', 360, 310);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(registration.attendee_name, 36, 340);

  // Ticket Tier Pill
  const isVip = registration.ticket_type.includes('VIP') || registration.ticket_type.includes('Reserved');
  ctx.fillStyle = isVip ? '#FEF3C7' : '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(360, 320, 240, 30, 8);
  ctx.fill();
  ctx.fillStyle = isVip ? '#92400E' : '#334155';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(registration.ticket_type, 375, 341);

  ctx.fillStyle = '#64748B';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(registration.attendee_email, 36, 365);

  // Metadata Footer
  ctx.font = '11px monospace';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`Pass Serial: ${registration.id}  •  Registered: ${new Date(registration.registered_at).toLocaleDateString()}`, 36, 520);
  ctx.fillText(`Security Policy: Single-Admission Verified Ticket`, 36, 538);

  // Perforated Stub Divider (Dashed Line & Notches)
  ctx.strokeStyle = '#CBD5E1';
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(700, 10);
  ctx.lineTo(700, 550);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Top and Bottom Semi-Circle Notches
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.arc(700, 10, 18, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(700, 550, 18, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Right Ticket Stub Section (QR Code Area)
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(702, 10, 288, 540);

  // QR Header on Stub
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ENTRY GATE PASS', 846, 55);

  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Scan at turnstile camera', 846, 75);

  // Try to find the existing rendered QR canvas or SVG from DOM
  const existingQrCanvas = document.querySelector(`canvas[data-qr="${registration.qr_pass_code}"]`) as HTMLCanvasElement;
  
  if (existingQrCanvas) {
    ctx.drawImage(existingQrCanvas, 746, 120, 200, 200);
  } else {
    // If not rendered yet, draw a placeholder QR frame with border
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(746, 120, 200, 200);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(746, 120, 200, 200);

    // Fallback QR simulation pattern
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('[ QR CODE SCANNER ]', 846, 220);
  }

  // QR Code Text
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(registration.qr_pass_code, 846, 355);

  // Status Badge
  const isCheckedIn = registration.status === 'checked_in';
  ctx.fillStyle = isCheckedIn ? '#DEF7EC' : '#EBF3FC';
  ctx.beginPath();
  ctx.roundRect(756, 385, 180, 32, 6);
  ctx.fill();
  ctx.fillStyle = isCheckedIn ? '#03543F' : '#1E429F';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(isCheckedIn ? 'ADMITTED (CHECKED IN)' : 'ACTIVE / VALID ENTRY', 846, 405);

  // Warning text on stub
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Non-transferable • Single Entry Only', 846, 510);
  ctx.fillText('Government-Issued ID may be inspected', 846, 526);

  // Reset alignment
  ctx.textAlign = 'start';

  // Trigger download
  const sanitizedName = registration.attendee_name.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedTitle = (event?.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const fileName = `Zabay_Pass_${sanitizedName}_${sanitizedTitle}.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens a clean printable window and triggers window.print() for an isolated, high-contrast ticket slip.
 */
export function printPassSlip({ registration, event, venue }: PassDetails): void {
  const printWindow = window.open('', '_blank', 'width=800,height=750');
  if (!printWindow) {
    alert('Please allow popups to print your event pass.');
    return;
  }

  const eventTitle = event?.title || registration.event_title || 'Bohol Event';
  const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'November 20, 2026';
  const venueName = venue?.name || 'Tagbilaran City Venue';
  const venueAddress = venue?.address || 'Tagbilaran City, Bohol, Philippines';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Pass - ${registration.attendee_name}</title>
        <style>
          @page {
            size: letter;
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 24px;
          }
          .ticket-card {
            border: 2px solid #0f172a;
            border-radius: 16px;
            overflow: hidden;
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
          }
          .ticket-header {
            background: #1e3a8a;
            color: #ffffff;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 1px;
          }
          .sub-brand {
            font-size: 10px;
            letter-spacing: 0.5px;
            opacity: 0.8;
          }
          .security-tag {
            background: rgba(255, 255, 255, 0.2);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
          }
          .ticket-body {
            padding: 24px;
          }
          .event-title {
            font-size: 22px;
            font-weight: 800;
            margin: 0 0 12px 0;
            color: #0f172a;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 3fr 2fr;
            gap: 20px;
            margin-top: 16px;
          }
          .meta-item {
            margin-bottom: 12px;
          }
          .meta-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .meta-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-top: 2px;
          }
          .attendee-name {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .ticket-tier {
            display: inline-block;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
            color: #1e3a8a;
          }
          .qr-section {
            border-left: 2px dashed #cbd5e1;
            padding-left: 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-code-box {
            background: #ffffff;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            display: inline-block;
          }
          .qr-string {
            font-family: monospace;
            font-weight: 700;
            font-size: 10px;
            margin-top: 8px;
            color: #334155;
          }
          .footer-note {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #1e3a8a; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer;">
            🖨️ Click to Print Pass Now
          </button>
        </div>

        <div class="ticket-card">
          <div class="ticket-header">
            <div>
              <div class="brand-title">ZABAY EVENT OPERATIONS</div>
              <div class="sub-brand">OFFICIAL ADMISSION PASS • BOHOL, PHILIPPINES</div>
            </div>
            <div class="security-tag">
              ✓ SECURE ADMISSION
            </div>
          </div>

          <div class="ticket-body">
            <h1 class="event-title">${eventTitle}</h1>

            <div class="details-grid">
              <div>
                <div class="meta-item">
                  <div class="meta-label">Pass Holder / Attendee</div>
                  <div class="attendee-name">${registration.attendee_name}</div>
                  <div style="font-size: 12px; color: #64748b;">${registration.attendee_email}</div>
                </div>

                <div class="meta-item">
                  <div class="meta-label">Ticket Tier</div>
                  <div class="ticket-tier">${registration.ticket_type}</div>
                </div>

                <div class="meta-item">
                  <div class="meta-label">Event Schedule</div>
                  <div class="meta-value">📅 ${eventDate}</div>
                </div>

                <div class="meta-item">
                  <div class="meta-label">Venue & Location</div>
                  <div class="meta-value">📍 ${venueName}</div>
                  <div style="font-size: 11px; color: #64748b;">${venueAddress}</div>
                </div>
              </div>

              <div class="qr-section">
                <div class="meta-label" style="margin-bottom: 8px;">Gate Turnstile QR</div>
                <div class="qr-code-box">
                  <!-- Embed scannable QR Image using Google Chart API or data uri -->
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registration.qr_pass_code)}" 
                       alt="QR Code" width="130" height="130" style="display: block;" />
                </div>
                <div class="qr-string">${registration.qr_pass_code}</div>
                <div style="font-size: 9px; color: #94a3b8; margin-top: 6px;">Single Admission Turnstile Policy</div>
              </div>
            </div>

            <div class="footer-note">
              <span>Pass Serial: <strong>${registration.id}</strong></span>
              <span>Registered: ${new Date(registration.registered_at).toLocaleDateString()}</span>
              <span>Status: <strong>${registration.status.toUpperCase()}</strong></span>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
