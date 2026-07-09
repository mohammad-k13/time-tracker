'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function HourlyRateSettings() {
      const [hourlyRate, setHourlyRate] = useState<string>('');
      const [loading, setLoading] = useState(true);
      const [saving, setSaving] = useState(false);
      const supabase = getSupabaseClient();
      const { toast } = useToast();

      useEffect(() => {
            const fetchSettings = async () => {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;

                  const { data } = await supabase
                        .from('user_settings')
                        .select('hourly_rate')
                        .eq('user_id', user.id)
                        .single();

                  if (data) {
                        setHourlyRate(String(data.hourly_rate));
                  }
                  setLoading(false);
            };

            fetchSettings();
      }, [supabase]);

      const handleSave = async () => {
            const rate = parseInt(hourlyRate.replace(/,/g, ''), 10);
            if (isNaN(rate) || rate < 0) {
                  toast({
                        title: 'Invalid value',
                        description: 'Please enter a valid positive number.',
                        variant: 'destructive',
                  });
                  return;
            }

            setSaving(true);
            try {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) throw new Error('Not authenticated');

                  const { error } = await supabase
                        .from('user_settings')
                        .upsert(
                              {
                                    user_id: user.id,
                                    hourly_rate: rate,
                                    updated_at: new Date().toISOString(),
                              },
                              { onConflict: 'user_id' },
                        );

                  if (error) throw error;

                  toast({
                        title: 'Settings saved',
                        description: `Hourly rate set to ${rate.toLocaleString('fa-IR')} تومان.`,
                  });
            } catch (err: any) {
                  toast({
                        title: 'Error',
                        description: err.message || 'Failed to save settings.',
                        variant: 'destructive',
                  });
            } finally {
                  setSaving(false);
            }
      };

      const formattedDisplay = hourlyRate
            ? parseInt(hourlyRate.replace(/,/g, ''), 10).toLocaleString('fa-IR')
            : '';

      return (
            <Card className="w-full max-w-2xl mx-auto">
                  <CardHeader>
                        <div className="flex items-center gap-2">
                              <Settings className="h-5 w-5 text-primary" />
                              <CardTitle>تنظیمات</CardTitle>
                        </div>
                        <CardDescription>نرخ دستمزد ساعتی خود را تعیین کنید</CardDescription>
                  </CardHeader>
                  <CardContent>
                        <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-2">
                                    <Label htmlFor="hourly-rate">نرخ ساعتی (تومان)</Label>
                                    <div className="flex gap-3">
                                          <div className="relative flex-1">
                                                <Input
                                                      id="hourly-rate"
                                                      type="text"
                                                      inputMode="numeric"
                                                      placeholder="مثال: 50,000"
                                                      value={hourlyRate}
                                                      onChange={(e) =>
                                                            setHourlyRate(e.target.value.replace(/[^0-9]/g, ''))
                                                      }
                                                      disabled={loading}
                                                      className="pr-16 text-left"
                                                      dir="ltr"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                                                      تومان
                                                </span>
                                          </div>
                                          <Button onClick={handleSave} disabled={saving || loading || !hourlyRate}>
                                                <Save className="mr-2 h-4 w-4" />
                                                ذخیره
                                          </Button>
                                    </div>
                                    {hourlyRate && !isNaN(parseInt(hourlyRate)) && (
                                          <p className="text-sm text-muted-foreground">
                                                = {parseInt(hourlyRate).toLocaleString('fa-IR')} تومان در ساعت
                                          </p>
                                    )}
                              </div>
                        </div>
                  </CardContent>
            </Card>
      );
}
