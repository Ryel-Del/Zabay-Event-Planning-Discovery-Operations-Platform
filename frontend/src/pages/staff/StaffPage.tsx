import React from 'react';
import { PersonnelPortal } from '../../components/staff/PersonnelPortal';

/**
 * Staff Portal Page: View-only operational schedule and task hub for event crew members.
 */
export const StaffPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PersonnelPortal />
    </div>
  );
};

export default StaffPage;
