'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Check, X, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toJalaliDate, formatTime, secondsToHours } from '@/lib/date-utils';
import { exportToCSV } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';
import { TiptapContent } from '@/components/ui/tiptap-editor';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TimeEntry {
      id: string;
      title: string;
      description: string | null;
      start_time: string;
      end_time: string | null;
      duration: number;
      is_active: boolean;
      paid: boolean;
}

export function TimeEntriesTable() {
      const [entries, setEntries] = useState<TimeEntry[]>([]);
      const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
      const [loading, setLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState('all');
      const [paidFilter, setPaidFilter] = useState('all');
      const router = useRouter();
      const { toast } = useToast();
      const supabase = getSupabaseClient();
      const [userId, setUserId] = useState<string | null>(null);
      const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
      const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
      const [editTitle, setEditTitle] = useState('');
      const [editDescription, setEditDescription] = useState('');

      useEffect(() => {
            const getCurrentUser = async () => {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (user) {
                        setUserId(user.id);
                        fetchEntries(user.id);
                  }
            };

            getCurrentUser();
      }, []);

      useEffect(() => {
            // Apply filters
            let filtered = [...entries];

            // Search filter
            if (searchTerm) {
                  filtered = filtered.filter(
                        (entry) =>
                              entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (entry.description && entry.description.toLowerCase().includes(searchTerm.toLowerCase())),
                  );
            }

            // Status filter
            if (statusFilter !== 'all') {
                  const isActive = statusFilter === 'active';
                  filtered = filtered.filter((entry) => entry.is_active === isActive);
            }

            // Paid filter
            if (paidFilter !== 'all') {
                  const isPaid = paidFilter === 'paid';
                  filtered = filtered.filter((entry) => entry.paid === isPaid);
            }

            setFilteredEntries(filtered);
      }, [entries, searchTerm, statusFilter, paidFilter]);

      const fetchEntries = async (uid: string) => {
            try {
                  setLoading(true);
                  const { data, error } = await supabase
                        .from('time_entries')
                        .select('*')
                        .eq('user_id', uid)
                        .order('start_time', { ascending: false });

                  if (error) {
                        throw error;
                  }

                  setEntries(data as any[] || []);
                  setFilteredEntries(data as any[] || []);
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to fetch time entries.',
                        variant: 'destructive',
                  });
            } finally {
                  setLoading(false);
            }
      };

      const togglePaidStatus = async (id: string, currentStatus: boolean) => {
            try {
                  const { error } = await supabase.from('time_entries').update({ paid: !currentStatus }).eq('id', id);

                  if (error) {
                        throw error;
                  }

                  // Update local state
                  setEntries(entries.map((entry) => (entry.id === id ? { ...entry, paid: !currentStatus } : entry)));

                  toast({
                        title: 'Status updated',
                        description: `Entry marked as ${!currentStatus ? 'paid' : 'unpaid'}.`,
                  });
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to update status.',
                        variant: 'destructive',
                  });
            }
      };

      const handleEditClick = (entry: TimeEntry) => {
            setEditingEntry(entry);
            setEditTitle(entry.title);
            setEditDescription(entry.description || '');
            setIsEditDialogOpen(true);
      };

      const handleSaveEdit = async () => {
            if (!editingEntry) return;

            try {
                  const { error } = await supabase
                        .from('time_entries')
                        .update({
                              title: editTitle,
                              description: editDescription,
                        })
                        .eq('id', editingEntry.id);

                  if (error) {
                        throw error;
                  }

                  // Update local state
                  setEntries(
                        entries.map((entry) =>
                              entry.id === editingEntry.id
                                    ? { ...entry, title: editTitle, description: editDescription }
                                    : entry,
                        ),
                  );

                  toast({
                        title: 'Entry updated',
                        description: 'Your changes have been saved.',
                  });

                  setIsEditDialogOpen(false);
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to update entry.',
                        variant: 'destructive',
                  });
            }
      };

      const handleExportCSV = () => {
            // Prepare data for export
            const exportData = filteredEntries.map((entry) => ({
                  Title: entry.title,
                  Description: entry.description || '',
                  'Start Date (Jalali)': toJalaliDate(entry.start_time),
                  'End Date (Jalali)': entry.end_time ? toJalaliDate(entry.end_time) : '',
                  'Duration (HH:MM:SS)': formatTime(entry.duration),
                  Hours: secondsToHours(entry.duration),
                  Status: entry.is_active ? 'Active' : 'Completed',
                  'Payment Status': entry.paid ? 'Paid' : 'Unpaid',
            }));

            exportToCSV(exportData, `time-entries-${new Date().toISOString().split('T')[0]}.csv`);

            toast({
                  title: 'Export successful',
                  description: 'Your time entries have been exported to CSV.',
            });
      };

      return (
            <Card>
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle>Time Entries Report</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <Button onClick={handleExportCSV} className="w-full sm:w-auto">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                              </Button>
                        </div>
                  </CardHeader>
                  <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                              <div className="relative w-full sm:w-1/3">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                          placeholder="Search entries..."
                                          className="pl-8"
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                              </div>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                          <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                          <SelectItem value="all">All Statuses</SelectItem>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                              </Select>
                              <Select value={paidFilter} onValueChange={setPaidFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                          <SelectValue placeholder="Payment Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                          <SelectItem value="all">All Payments</SelectItem>
                                          <SelectItem value="paid">Paid</SelectItem>
                                          <SelectItem value="unpaid">Unpaid</SelectItem>
                                    </SelectContent>
                              </Select>
                        </div>

                        <div className="rounded-md border">
                              <Table>
                                    <TableHeader>
                                          <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead className="hidden md:table-cell">Date (Jalali)</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead className="hidden md:table-cell">Status</TableHead>
                                                <TableHead>Paid</TableHead>
                                                <TableHead>Actions</TableHead>
                                          </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                          {loading ? (
                                                <TableRow>
                                                      <TableCell colSpan={6} className="text-center py-8">
                                                            Loading entries...
                                                      </TableCell>
                                                </TableRow>
                                          ) : filteredEntries.length === 0 ? (
                                                <TableRow>
                                                      <TableCell colSpan={6} className="text-center py-8">
                                                            No entries found.
                                                      </TableCell>
                                                </TableRow>
                                          ) : (
                                                filteredEntries.map((entry) => (
                                                      <TableRow key={entry.id}>
                                                            <TableCell>
                                                                  <div className="font-medium">{entry.title}</div>
                                                                  <div className="text-sm text-muted-foreground hidden sm:block">
                                                                        {entry.description ? (
                                                                              <TiptapContent
                                                                                    content={entry.description}
                                                                              />
                                                                        ) : (
                                                                              'No description'
                                                                        )}
                                                                  </div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                  {toJalaliDate(entry.start_time)}
                                                            </TableCell>
                                                            <TableCell>
                                                                  <div className="font-mono">
                                                                        {formatTime(entry.duration)}
                                                                  </div>
                                                                  <div className="text-xs text-muted-foreground">
                                                                        {secondsToHours(entry.duration)} hours
                                                                  </div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                  {entry.is_active ? (
                                                                        <Badge
                                                                              variant="outline"
                                                                              className="bg-primary/10 text-primary border-primary/20"
                                                                        >
                                                                              Active
                                                                        </Badge>
                                                                  ) : (
                                                                        <Badge
                                                                              variant="outline"
                                                                              className="bg-muted/50 text-muted-foreground"
                                                                        >
                                                                              Completed
                                                                        </Badge>
                                                                  )}
                                                            </TableCell>
                                                            <TableCell>
                                                                  <div className="flex items-center">
                                                                        <Checkbox
                                                                              checked={entry.paid}
                                                                              onCheckedChange={() =>
                                                                                    togglePaidStatus(
                                                                                          entry.id,
                                                                                          entry.paid,
                                                                                    )
                                                                              }
                                                                              className="mr-2"
                                                                        />
                                                                        {entry.paid ? (
                                                                              <Badge
                                                                                    variant="outline"
                                                                                    className="bg-green-500/10 text-green-500 border-green-500/20"
                                                                              >
                                                                                    <Check className="mr-1 h-3 w-3" />
                                                                                    Paid
                                                                              </Badge>
                                                                        ) : (
                                                                              <Badge
                                                                                    variant="outline"
                                                                                    className="bg-orange-500/10 text-orange-500 border-orange-500/20"
                                                                              >
                                                                                    <X className="mr-1 h-3 w-3" />
                                                                                    Unpaid
                                                                              </Badge>
                                                                        )}
                                                                  </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEditClick(entry)}
                                                                  >
                                                                        <Edit className="h-4 w-4" />
                                                                  </Button>
                                                            </TableCell>
                                                      </TableRow>
                                                ))
                                          )}
                                    </TableBody>
                              </Table>
                        </div>

                        {/* Edit Dialog */}
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                              <DialogContent>
                                    <DialogHeader>
                                          <DialogTitle>Edit Time Entry</DialogTitle>
                                          <DialogDescription>
                                                Update the title and description of this time entry.
                                          </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                          <div className="space-y-2">
                                                <Input
                                                      placeholder="What are you working on?"
                                                      value={editTitle}
                                                      onChange={(e) => setEditTitle(e.target.value)}
                                                />
                                                <TiptapEditor
                                                      content={editDescription}
                                                      onChange={setEditDescription}
                                                      placeholder="Add a description (optional)"
                                                      className="mt-2"
                                                />
                                          </div>
                                          <div className="flex justify-end gap-2">
                                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                                      Cancel
                                                </Button>
                                                <Button onClick={handleSaveEdit}>Save Changes</Button>
                                          </div>
                                    </div>
                              </DialogContent>
                        </Dialog>
                  </CardContent>
            </Card>
      );
}
