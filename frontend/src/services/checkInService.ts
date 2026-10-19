import type { Registration, AuditLog, User } from '../types';

export interface CheckInResult {
  success: boolean;
  message: string;
  registration?: Registration;
  isDuplicate?: boolean;
  auditLog?: AuditLog;
}

/**
 * Validates and verifies an attendee QR pass code against registered records.
 * Protects against invalid ticket IDs and prevents duplicate check-ins.
 */
export function verifyAndCheckInAttendee(
  qrCode: string,
  registrations: Registration[],
  currentUser: User
): CheckInResult {
  const code = qrCode.trim().toUpperCase();
  const reg = registrations.find(
    (r) => r.qr_pass_code.toUpperCase() === code || r.id.toUpperCase() === code
  );

  if (!reg) {
    return {
      success: false,
      message: 'Invalid QR pass code. No active registration record found in database.',
    };
  }

  if (reg.status === 'checked_in') {
    return {
      success: false,
      isDuplicate: true,
      registration: reg,
      message: `DUPLICATE CHECK-IN PREVENTED: ${reg.attendee_name} was already verified and admitted.`,
    };
  }

  const updatedRegistration: Registration = {
    ...reg,
    status: 'checked_in',
  };

  const auditLog: AuditLog = {
    id: `aud-${Date.now()}`,
    user_id: currentUser.id,
    user_name: currentUser.name,
    action: 'CHECK_IN',
    entity_type: 'registration',
    entity_id: reg.id,
    change_summary: `Admitted attendee ${reg.attendee_name} (${reg.ticket_type}) via QR Pass. Check-in registered into attendance table.`,
    created_at: new Date().toISOString(),
  };

  return {
    success: true,
    registration: updatedRegistration,
    auditLog,
    message: `Verified! Welcome ${reg.attendee_name} (${reg.ticket_type}).`,
  };
}
