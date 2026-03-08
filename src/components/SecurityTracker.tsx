import React from 'react';
import { useSecurityTracking } from '@/hooks/useSecurityTracking';

const SecurityTracker: React.FC = () => {
  useSecurityTracking();
  return null;
};

export default SecurityTracker;
