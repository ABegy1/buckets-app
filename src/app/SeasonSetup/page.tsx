'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import NextSeasonModal from '@/components/NextSeason/NextSeason';

const SeasonSetupPage = () => {
  const router = useRouter();

  return (
    <NextSeasonModal
      isOpen
      onClose={() => router.push('/Admin')}
      onStartSeason={() => router.push('/Standings')}
    />
  );
};

export default SeasonSetupPage;
