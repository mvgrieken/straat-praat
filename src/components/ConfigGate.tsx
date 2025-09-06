import React from 'react';

type Props = { 
  children: React.ReactNode;
};

export function ConfigGate({ children }: Props) {
  // No validation - just render children directly
  // Supabase client is now hardcoded and will work
  return <>{children}</>;
}

