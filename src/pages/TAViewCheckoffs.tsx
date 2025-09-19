import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Filter, RefreshCw, Check, X, UserCheck, ArrowLeft } from "lucide-react";
import UserProfile from "@/components/UserProfile";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://api.bearqueue.com";

type Ticket = {
  id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  student_email?: string | null;
  type: "OH" | "Lab";
  subtype?: string | null;
  details?: string | null;      // e.g., "Lab 3 - Workstation WS5"
  location?: string | null;
  status: "waiting" | "being_helped" | "done" | "cancelled";
  helped_by_id?: string | null;
  helped_by_name?: string | null;
  created_at: string;           // ISO
  updated_at: string;           // ISO
  started_help_at?: string | null;
  finished_at?: string | null;
};

type Stats = {
  class_id: string;
  students_in_queue: number;
  students_being_helped: number;
  average_help_time: number;
  estimated_wait_time: number;
};

function timeAgo(iso: string) {
  const created = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function TAViewCheckoffs() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>("all");
  const [labFilter, setLabFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Fetch
  const fetchTickets = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}/closed-checkoffs`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to load tickets (${res.status})`);
    const data: Ticket[] = await res.json();
    setTickets(data);
  };

  const fetchStats = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}/stats`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
    const data: Stats = await res.json();
    setStats(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchTickets(), fetchStats()]);
      } catch (e: any) {
        if (!cancelled) setErr(e.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classId]);

  // Only Lab Check-off tickets
  const checkoffTickets = useMemo(() => {
    return tickets.filter(t =>
      t.type === "Lab" &&
      (t.subtype?.toLowerCase().includes("check") ?? false) // matches "Check-off" / "checkoff"
    );
  }, [tickets]);

  // Extract lab numbers from details like "Lab 3 - Workstation WS5"
  const labNumbers = useMemo(() => {
    const nums = new Set<string>();
    for (const t of checkoffTickets) {
      const labNumMatch = t.details?.match(/Lab\s+(\d+)/i);
      if (labNumMatch?.[1]) nums.add(labNumMatch[1]);
    }
    return ["all", ...Array.from(nums).sort((a, b) => Number(a) - Number(b))];
  }, [checkoffTickets]);

  const filtered = useMemo(() => {
    return checkoffTickets.filter(t => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (labFilter !== "all") {
        const m = t.details?.match(/Lab\s+(\d+)/i);
        if ((m?.[1] ?? "") !== labFilter) return false;
      }
      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${t.student_name} ${t.student_email ?? ""} ${t.details ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [checkoffTickets, statusFilter, labFilter, search]);

  const patchTicket = async (id: string, body: Partial<Ticket>) => {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Failed to update (${res.status})`);
    }
    await Promise.all([fetchTickets(), fetchStats()]);
  };

  const handleAssign = async (t: Ticket) => {
    if (t.status !== "waiting") return;
    await patchTicket(t.id, { status: "being_helped" });
  };
  const handleClose = async (t: Ticket) => {
    if (t.status !== "being_helped") return;
    await patchTicket(t.id, { status: "done" });
  };
  const handleCancel = async (t: Ticket) => {
    if (t.status !== "waiting" && t.status !== "being_helped") return;
    await patchTicket(t.id, { status: "cancelled" });
  };

  if (loading) return <div className="p-6">Loading check-offs…</div>;
  if (err) return <div className="p-6 text-destructive">Error: {err}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lab Check-offs</h1>
              <p className="text-muted-foreground">Filter and manage lab check-off tickets</p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main list */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-queue-waiting mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Waiting</p>
                      <p className="text-2xl font-bold">
                        {checkoffTickets.filter(t => t.status === "waiting").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <UserCheck className="w-8 h-8 text-queue-active mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Being Helped</p>
                      <p className="text-2xl font-bold">
                        {checkoffTickets.filter(t => t.status === "being_helped").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <RefreshCw className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{checkoffTickets.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Check-off Tickets</CardTitle>
                <CardDescription>Filtered results shown below</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((t) => {
                        const badge =
                          t.status === "waiting" ? "bg-queue-waiting" :
                          t.status === "being_helped" ? "bg-queue-active" :
                          t.status === "done" ? "bg-success" : "bg-muted";
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">
                              <div>{t.student_name}</div>
                              <div className="text-xs text-muted-foreground">{t.student_email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{t.details || "—"}</div>
                              {t.location && <div className="text-xs text-muted-foreground">@ {t.location}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge className={badge + " text-white capitalize"}>{t.status.replace("_"," ")}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {timeAgo(t.created_at)}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {t.status === "waiting" && (
                                <Button size="sm" variant="outline" onClick={() => handleAssign(t)}>
                                  <UserCheck className="w-4 h-4 mr-1" /> Assign
                                </Button>
                              )}
                              {t.status === "being_helped" && (
                                <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleClose(t)}>
                                  <Check className="w-4 h-4 mr-1" /> Check Off
                                </Button>
                              )}
                              {(t.status === "waiting" || t.status === "being_helped") && (
                                <Button size="sm" variant="destructive" onClick={() => handleCancel(t)}>
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No tickets match your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-primary" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="being_helped">Being Helped</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lab Number</Label>
                  <Select value={labFilter} onValueChange={setLabFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      {labNumbers.map(n => (
                        <SelectItem key={n} value={n}>{n === "all" ? "All" : `Lab ${n}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Student, email, details…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Separator />
                <Button variant="outline" onClick={() => { setStatusFilter("all"); setLabFilter("all"); setSearch(""); }}>
                  Reset Filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queue Snapshot</CardTitle>
                <CardDescription>Fast metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>In queue:</span>
                  <span className="font-medium">{stats?.students_in_queue ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Being helped:</span>
                  <span className="font-medium">{stats?.students_being_helped ?? "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg help time:</span>
                  <span className="font-medium">{stats?.average_help_time ?? "—"} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Est. wait:</span>
                  <span className="font-medium">{stats?.estimated_wait_time ?? "—"} min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
