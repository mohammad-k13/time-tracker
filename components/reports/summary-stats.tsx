'use client';

import { useState, useEffect } from 'react';
import { Clock, DollarSign, Calendar, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatTime, secondsToHours } from '@/lib/date-utils';

interface SummaryStats {
      totalEntries: number;
      totalDuration: number;
      completedEntries: number;
      paidEntries: number;
}

export function SummaryStats() {
      const [stats, setStats] = useState<SummaryStats>({
            totalEntries: 0,
            totalDuration: 0,
            completedEntries: 0,
            paidEntries: 0,
      });
      const [loading, setLoading] = useState(true);
      const supabase = getSupabaseClient();
      const [userId, setUserId] = useState<string | null>(null);

      useEffect(() => {
            const getCurrentUser = async () => {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (user) {
                        setUserId(user.id);
                        fetchStats(user.id);
                  }
            };

            getCurrentUser();
      }, [supabase]);

      const fetchStats = async (uid: string) => {
            try {
                  setLoading(true);

                  // Get all entries for the current user
                  const { data, error } = await supabase.from('time_entries').select('*').eq('user_id', uid);

                  if (error) {
                        throw error;
                  }

                  const entries = data || [];

                  // Calculate stats
                  const totalEntries = entries.length;
                  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
                  const completedEntries = entries.filter((entry) => !entry.is_active).length;
                  const paidEntries = entries.filter((entry) => entry.paid).length;

                  setStats({
                        totalEntries,
                        totalDuration,
                        completedEntries,
                        paidEntries,
                  });
            } catch (error) {
                  console.error('Error fetching stats:', error);
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Total Time Entries</CardTitle>
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                              <div className="text-2xl font-bold">{loading ? '...' : stats.totalEntries}</div>
                              <p className="text-xs text-muted-foreground">
                                    {loading ? '...' : `${stats.completedEntries} completed`}
                              </p>
                        </CardContent>
                  </Card>

                  <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                              <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                              <div className="text-2xl font-bold">
                                    {loading ? '...' : secondsToHours(stats.totalDuration)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                    {loading ? '...' : formatTime(stats.totalDuration)}
                              </p>
                        </CardContent>
                  </Card>

                  <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                              <div className="text-2xl font-bold">
                                    {loading || stats.totalEntries === 0
                                          ? '0%'
                                          : `${Math.round((stats.completedEntries / stats.totalEntries) * 100)}%`}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                    {loading ? '...' : `${stats.completedEntries}/${stats.totalEntries} entries`}
                              </p>
                        </CardContent>
                  </Card>

                  <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                              <div className="text-2xl font-bold">
                                    {loading || stats.totalEntries === 0
                                          ? '0%'
                                          : `${Math.round((stats.paidEntries / stats.totalEntries) * 100)}%`}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                    {loading ? '...' : `${stats.paidEntries}/${stats.totalEntries} entries paid`}
                              </p>
                        </CardContent>
                  </Card>
            </div>
      );
}
