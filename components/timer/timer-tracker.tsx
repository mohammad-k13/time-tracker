'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TiptapEditor } from '@/components/ui/tiptap-editor';

interface TimerState {
      id?: string;
      title: string;
      description: string;
      startTime: number | null;
      elapsedTime: number;
      isRunning: boolean;
}

export function TimerTracker() {
      const [timer, setTimer] = useState<TimerState>({
            title: '',
            description: '',
            startTime: null,
            elapsedTime: 0,
            isRunning: false,
      });
      const intervalRef = useRef<NodeJS.Timeout | null>(null);
      const { toast } = useToast();
      const router = useRouter();
      const supabase = getSupabaseClient();
      const [userId, setUserId] = useState<string | null>(null);

      // Load timer from localStorage on component mount
      useEffect(() => {
            const savedTimer = localStorage.getItem('timer');
            if (savedTimer) {
                  const parsedTimer = JSON.parse(savedTimer);

                  // Recalculate elapsed time if the timer was running
                  if (parsedTimer.isRunning && parsedTimer.startTime) {
                        parsedTimer.elapsedTime = Date.now() - parsedTimer.startTime;
                        resumeTimer(parsedTimer.startTime);
                  }

                  setTimer(parsedTimer);
            }
      }, []);

      // Save timer to localStorage whenever it changes
      useEffect(() => {
            localStorage.setItem('timer', JSON.stringify(timer));
      }, [timer]);

      useEffect(() => {
            if (timer.isRunning && timer.startTime) {
                  resumeTimer(timer.startTime);
            } else {
                  if (intervalRef.current !== null) {
                        clearInterval(intervalRef.current);
                  }
            }
      }, [timer.isRunning]);

      // Get current user on component mount
      useEffect(() => {
            const getCurrentUser = async () => {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (user) {
                        setUserId(user.id);
                  }
            };

            getCurrentUser();
      }, [supabase]);

      const resumeTimer = (startTime: number) => {
            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                  setTimer((prev) => ({
                        ...prev,
                        elapsedTime: Date.now() - startTime,
                  }));
            }, 1000);
      };

      // Format time as HH:MM:SS
      const formatTime = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return [
                  hours.toString().padStart(2, '0'),
                  minutes.toString().padStart(2, '0'),
                  seconds.toString().padStart(2, '0'),
            ].join(':');
      };

      const startTimer = (currentTimer = timer) => {
            // If timer is already running, do nothing
            if (currentTimer.isRunning) return;

            const now = Date.now();
            const newStartTime = now - currentTimer.elapsedTime;

            // Clear any existing interval
            if (intervalRef.current) {
                  clearInterval(intervalRef.current);
            }

            // Start a new interval
            intervalRef.current = setInterval(() => {
                  setTimer((prev) => ({
                        ...prev,
                        elapsedTime: Date.now() - newStartTime,
                  }));
            }, 1000);

            setTimer((prev) => ({
                  ...prev,
                  startTime: newStartTime,
                  isRunning: true,
            }));

            // Save to database if we have a title and user is authenticated
            if (currentTimer.title && !currentTimer.id && userId) {
                  saveTimerToDatabase({
                        ...currentTimer,
                        startTime: newStartTime,
                        isRunning: true,
                  });
            } else if (currentTimer.title && !userId) {
                  toast({
                        title: 'Authentication error',
                        description: 'Please log in again to track time.',
                        variant: 'destructive',
                  });
            }
      };

      const pauseTimer = async () => {
            if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
            }

            setTimer((prev) => ({
                  ...prev,
                  isRunning: false,
            }));

            // Update in database
            if (timer.id) {
                  await updateTimerInDatabase({
                        ...timer,
                        isRunning: false,
                  });
            }
      };

      const stopTimer = async () => {
            if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
            }

            // If timer has an ID, complete it in the database
            if (timer.id) {
                  await completeTimerInDatabase();
            }

            // Reset the timer
            setTimer({
                  title: '',
                  description: '',
                  startTime: null,
                  elapsedTime: 0,
                  isRunning: false,
            });
      };

      const saveTimerToDatabase = async (timerData: TimerState) => {
            try {
                  if (!userId) {
                        throw new Error('User not authenticated');
                  }

                  const { data, error } = await supabase
                        .from('time_entries')
                        .insert([
                              {
                                    user_id: userId,
                                    title: timerData.title,
                                    description: timerData.description,
                                    start_time: new Date(timerData.startTime || Date.now()).toISOString(),
                                    is_active: timerData.isRunning,
                                    duration: Math.floor(timerData.elapsedTime / 1000),
                              },
                        ])
                        .select();

                  if (error) {
                        throw error;
                  }

                  if (data && data[0]) {
                        setTimer((prev) => ({
                              ...prev,
                              id: data[0].id as string,
                        }));

                        toast({
                              title: 'Timer started',
                              description: 'Your time entry has been created.',
                        });
                  }
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to save timer.',
                        variant: 'destructive',
                  });
            }
      };

      const updateTimerInDatabase = async (timerData: TimerState) => {
            if (!timerData.id) return;

            try {
                  const { error } = await supabase
                        .from('time_entries')
                        .update({
                              title: timerData.title,
                              description: timerData.description,
                              is_active: timerData.isRunning,
                              duration: Math.floor(timerData.elapsedTime / 1000),
                        })
                        .eq('id', timerData.id);

                  if (error) {
                        throw error;
                  }
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to update timer.',
                        variant: 'destructive',
                  });
            }
      };

      const completeTimerInDatabase = async () => {
            if (!timer.id) return;

            try {
                  const { error } = await supabase
                        .from('time_entries')
                        .update({
                              end_time: new Date().toISOString(),
                              is_active: false,
                              duration: Math.floor(timer.elapsedTime / 1000),
                        })
                        .eq('id', timer.id);

                  if (error) {
                        throw error;
                  }

                  toast({
                        title: 'Timer stopped',
                        description: 'Your time entry has been completed.',
                  });

                  router.refresh();
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to complete timer.',
                        variant: 'destructive',
                  });
            }
      };

      const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setTimer((prev) => ({
                  ...prev,
                  title: e.target.value,
            }));

            // Update in database if we have an ID
            if (timer.id) {
                  updateTimerInDatabase({
                        ...timer,
                        title: e.target.value,
                  });
            }
      };

      const handleDescriptionChange = (content: string) => {
            setTimer((prev) => ({
                  ...prev,
                  description: content,
            }));

            // Update in database if we have an ID
            if (timer.id) {
                  updateTimerInDatabase({
                        ...timer,
                        description: content,
                  });
            }
      };

      // Cleanup interval on unmount
      useEffect(() => {
            return () => {
                  if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                  }
            };
      }, []);

      return (
            <Card className="w-full max-w-2xl mx-auto">
                  <CardHeader>
                        <CardTitle className="text-2xl text-center">Time Tracker</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                        <div className="space-y-2">
                              <Input
                                    placeholder="What are you working on?"
                                    value={timer.title}
                                    onChange={handleTitleChange}
                                    disabled={timer.id !== undefined && !timer.isRunning}
                              />
                              <TiptapEditor
                                    content={timer.description}
                                    onChange={handleDescriptionChange}
                                    disabled={timer.id !== undefined && !timer.isRunning}
                                    placeholder="Add a description (optional)"
                                    className="mt-2"
                              />
                        </div>

                        <div className="flex flex-col items-center justify-center py-8">
                              <div className="text-7xl font-bold tabular-nums mb-6">
                                    {formatTime(timer.elapsedTime)}
                              </div>

                              <div className="flex gap-4">
                                    {!timer.isRunning ? (
                                          <Button
                                                onClick={() => startTimer()}
                                                size="lg"
                                                disabled={!timer.title}
                                                className="px-8"
                                          >
                                                <Play className="mr-2 h-5 w-5" />
                                                {timer.elapsedTime > 0 ? 'Resume' : 'Start'}
                                          </Button>
                                    ) : (
                                          <Button onClick={pauseTimer} size="lg" className="px-8">
                                                <Pause className="mr-2 h-5 w-5" />
                                                Pause
                                          </Button>
                                    )}

                                    <Button
                                          onClick={stopTimer}
                                          variant="outline"
                                          size="lg"
                                          disabled={timer.elapsedTime === 0}
                                          className="px-8"
                                    >
                                          <Square className="mr-2 h-5 w-5" />
                                          Stop
                                    </Button>
                              </div>
                        </div>
                  </CardContent>
                  <CardFooter className="flex justify-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        Timer will continue running even if you close this page
                  </CardFooter>
            </Card>
      );
}
