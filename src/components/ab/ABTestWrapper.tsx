'use client';

import { useEffect, useState } from 'react';
import { getVariant, trackABEvent } from '@/lib/ab-test';

interface ABTestWrapperProps {
  experimentId: string;
  variantA: React.ReactNode;
  variantB: React.ReactNode;
}

export default function ABTestWrapper({ experimentId, variantA, variantB }: ABTestWrapperProps) {
  const [variant, setVariant] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    const v = getVariant(experimentId);
    setVariant(v);
    trackABEvent(experimentId, v, 'impression');
  }, [experimentId]);

  if (!variant) return null;
  return <>{variant === 'A' ? variantA : variantB}</>;
}
