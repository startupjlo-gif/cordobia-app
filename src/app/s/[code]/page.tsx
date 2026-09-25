'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ParticipantChat } from '@/components/ParticipantChat';

export default function ParticipantSessionPage() {
  const params = useParams();
  const code = (params?.code as string) || 'CORDOBIA2026';

  return <ParticipantChat sessionCode={code} />;
}
