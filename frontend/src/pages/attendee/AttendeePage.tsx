import React from 'react';
import { EventDiscovery } from '../../components/attendee/EventDiscovery';

interface AttendeePageProps {
  onOpenScannerWithPass?: (code: string) => void;
}

/**
 * Attendee Page: Public event discovery, interactive OpenStreetMap venue explorer,
 * Luma-style event story cards, and digital QR ticket pass wallet.
 */
export const AttendeePage: React.FC<AttendeePageProps> = ({ onOpenScannerWithPass }) => {
  return (
    <div className="space-y-6">
      <EventDiscovery onOpenScannerWithPass={onOpenScannerWithPass} />
    </div>
  );
};

export default AttendeePage;
