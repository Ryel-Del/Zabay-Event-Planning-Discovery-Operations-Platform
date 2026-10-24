import React from 'react';
import { VenueManagerPortal } from '../../components/venue/VenueManagerPortal';
import type { VenueView } from '../../components/layout/AppSidebar';

interface VenuePageProps {
  currentView?: VenueView;
  onSelectView?: (view: VenueView) => void;
}

/**
 * Venue Management Page: Dedicated operations dashboard for Bohol venue managers.
 * Enforces EXCLUDE temporal conflict checks and manages multi-hall inventories.
 */
export const VenuePage: React.FC<VenuePageProps> = ({ currentView = 'overview', onSelectView }) => {
  return (
    <div className="space-y-6">
      <VenueManagerPortal currentView={currentView} onSelectView={onSelectView} />
    </div>
  );
};

export default VenuePage;
