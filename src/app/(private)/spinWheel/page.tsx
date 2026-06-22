import { useState } from 'react';
import { router } from 'expo-router';

import { SpinWheelScreen } from '@/components/SpinWheel';
import type { WheelPlayer } from '@/components/SpinWheel';

const MOCK_PLAYERS: WheelPlayer[] = [
  { id: '1', name: 'Alex', avatarUri: null },
  { id: '2', name: 'Mia', avatarUri: null },
  { id: '3', name: 'Ben', avatarUri: null },
  { id: '4', name: 'Chloe', avatarUri: null },
];

export default function SpinWheelPage(): JSX.Element {
  const [players] = useState<WheelPlayer[]>(MOCK_PLAYERS);

  async function requestWinner(): Promise<number> {
    return Math.floor(Math.random() * players.length);
  }

  function handleBack(): void {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(private)/dashboard/page');
    }
  }

  return (
    <SpinWheelScreen
      players={players}
      loading={false}
      error={false}
      requestWinner={requestWinner}
      onBack={handleBack}
    />
  );
}
