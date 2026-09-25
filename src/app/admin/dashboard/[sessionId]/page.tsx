'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { GroupDashboard } from '@/components/GroupDashboard';

export default function AdminDashboardPage() {
  const params = useParams();
  const sessionId = (params?.sessionId as string) || 'CORDOBIA2026';

  return <GroupDashboard sessionId={sessionId} />;
}
