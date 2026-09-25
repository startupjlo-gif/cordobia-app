'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { IndividualReport } from '@/components/IndividualReport';

export default function IndividualReportPage() {
  const params = useParams();
  const companyId = (params?.companyId as string) || 'emp-1';

  return <IndividualReport empresaId={companyId} />;
}
