import { useEffect } from 'react';
import { logTelemetry } from './telemetry';

export const useTelemetry = (componentName: string) => {
  const logAction = (action: string, metadata: any = {}) => {
    logTelemetry('NEURAL_INTERACTION', `${componentName}:${action}`, { component: componentName, ...metadata });
  };

  return { logAction };
};
