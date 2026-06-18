'use client';

import { useState } from 'react';

import { TimerTracker } from '@/components/timer/timer-tracker';
import { TimeEntries } from '@/components/timer/time-entries';
import { HourlyRateSettings } from '@/components/settings/hourly-rate-settings';
import { WalletPanel } from '@/components/wallet/wallet-panel';

export default function DashboardPage() {
      const [totalEarnings, setTotalEarnings] = useState(0);

      return (
            <div className="space-y-8">
                  <TimerTracker />
                  <TimeEntries onTotalEarningsChange={setTotalEarnings} />
                  <WalletPanel totalEarnings={totalEarnings} />
                  <HourlyRateSettings />
            </div>
      );
}
