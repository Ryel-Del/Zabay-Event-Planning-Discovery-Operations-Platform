import React from 'react';
import { VenueManagerPortal } from '../../components/venue/VenueManagerPortal';

/**
 * Venue Management Page: Dedicated operations dashboard for Bohol venue managers.
 * Enforces EXCLUDE temporal conflict checks and manages multi-hall inventories.
 */
export const VenuePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <VenueManagerPortal />
    </div>
  );
};

export default VenuePage;
