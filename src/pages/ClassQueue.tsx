import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, UserCheck, Plus, BookOpen, FlaskConical, Timer, RefreshCw } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import TicketCreationDialog from "@/components/TicketCreationDialog";
import EditTicketDialog from "@/components/EditTicketDialog";
import TALogin from "@/components/TALogin";
import { ClassDetail, Stats } from "@/class/classDetail";
import { Me } from "@/class/auth";
import { Ticket } from "@/class/ticket";

const API_BASE = import.meta.env.VITE_API_BASE;

const ClassQueue = () => {
  const { classId } = useParams<{ classId: string }>();

  const [me, setMe] = useState<Me | null>(null);
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [userRole, setUserRole] = useState<"student" | "ta">("student");
  const navigate = useNavigate();

  // derived: does current user already have an open ticket?
  const myOpenTicket = useMemo(
    () =>
      me
        ? tickets.find(
            (t) =>
              t.student_id === me.sub &&
              (t.status === "waiting" || t.status === "being_helped")
          )
        : undefined,
    [tickets, me]
  );
  
  const hasUserTicket = !!myOpenTicket;

  const displayName = cls ? `${cls.department_code} ${cls.class_number}` : "";
  const displayInstructor = cls?.instructor_name || "TBA";

  const isTA = me?.role === "ta" || me?.role ==="admin";

const patchTicket = async (
  ticketId: string,
  body: Partial<{
    status: "waiting" | "being_helped" | "done" | "cancelled";
    helped_by_id: string;
    helped_by_name: string;
  }>
) => {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Failed to update ticket (${res.status})`);
  }
  await Promise.all([fetchTickets(), fetchStats()]);
};

const handleAssign = async (t: any) => {
  if (t.status !== "waiting") return;
  await patchTicket(t.id, {
    status: "being_helped",
    helped_by_id: me?.sub ?? "",
    helped_by_name: me?.name ?? "",
  });
};

const handleReopen = async (t: any) => {
  await patchTicket(t.id, {
    status: "waiting",
    helped_by_id: null,
    helped_by_name: null,
  });
};


const handleClose = async (t: any) => {
  // Only close if currently being helped
  if (t.status !== "being_helped") return;
  await patchTicket(t.id, { status: "done" });
};

const handleCancel = async (t: any) => {
  // Allow cancel while waiting or being_helped
  if (t.status !== "waiting" && t.status !== "being_helped") return;
  await patchTicket(t.id, { status: "cancelled" }); // soft delete
};

  const fetchMe = async () => {
    const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
    if (res.ok) setMe(await res.json());
    else setMe(null);
  };

  const fetchClass = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch class (${res.status})`);
    setCls(await res.json());
  };

  const fetchStats = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}/stats`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch stats (${res.status})`);
    setStats(await res.json());
  };

  const fetchTickets = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}/tickets`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch tickets (${res.status})`);
    setTickets(await res.json());
  };

  const refreshAll = async () => {
    setErr(null);
    try {
      await Promise.all([fetchMe(), fetchClass(), fetchStats(), fetchTickets()]);
    } catch (e: any) {
      setErr(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Position for "You" if present (among waiting + being_helped lists)
  const yourPosition = useMemo(() => {
    if (!myOpenTicket) return null;
    const ordered = [
      ...tickets.filter(t => t.status === "being_helped").sort((a, b) => (a.started_help_at || "").localeCompare(b.started_help_at || "")),
      ...tickets.filter(t => t.status === "waiting").sort((a, b) => a.created_at.localeCompare(b.created_at)),
    ];
    const idx = ordered.findIndex(t => t.id === myOpenTicket.id);
    return idx >= 0 ? idx + 1 : null;
  }, [tickets, myOpenTicket]);

  // Simple wait estimate for you
  const estimatedForYou = useMemo(() => {
    if (!yourPosition || !stats?.average_help_time) return null;
    // naive: people ahead of you * avg help
    const ahead = Math.max(0, yourPosition - 1);
    return ahead * stats.average_help_time;
  }, [yourPosition, stats?.average_help_time]);

  const progressPercentage = useMemo(() => {
    if (!yourPosition || !stats?.students_in_queue) return 0;
    // assuming "in line" equals waiting + yourself, scale a simple progress
    const denom = Math.max(1, stats.students_in_queue);
    return Math.min(100, ((denom - yourPosition + 1) / denom) * 100);
  }, [yourPosition, stats?.students_in_queue]);

  function timeSince(dateString: string) {
    console.log('create at', dateString)
    const created = new Date(dateString + "Z");

    const now = new Date();
    console.log(now)
    const diffMs = now.getTime() - created.getTime();
    console.log('diff', diffMs)
    const diffMins = Math.floor(diffMs / 60000);
  
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  // Create a ticket (minimal body; your dialog can be wired to pass more fields)
  const handleCreateTicket = async (payload: {
    class_id: string;
    type: "OH" | "Lab";
    subtype?: string;
    details?: string;
    location?: string;
    hw_number?: string;
    question_number?: string;
    lab_number?: string;
    workstation?: string;
    teammates?: { id: string; email: string }[];
  }) => {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Failed to create ticket (${res.status})`);
    }
  
    await Promise.all([fetchTickets(), fetchStats()]);
    setShowTicketDialog(false);
  };

  // Edit dialog launcher
  const handleEditTicket = (ticket: Ticket) => {
    if (me && ticket.student_id === me.sub) {
      setEditingTicket(ticket);
      setShowEditDialog(true);
    }
  };

  // Save ticket change (owner can edit while waiting)
  const handleSaveTicket = async (updated: Partial<Ticket> & { id: string }) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${updated.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: updated.details,
          location: updated.location,
          type: updated.type,
          subtype: updated.subtype,
        }),
      });
      if (!res.ok) throw new Error(`Failed to update ticket (${res.status})`);
      setShowEditDialog(false);
      setEditingTicket(null);
      await fetchTickets();
    } catch (e: any) {
      alert(e.message || "Failed to update ticket");
    }
  };

  // Leave queue (delete own ticket)
  const handleLeaveQueue = async () => {
    try {
      if (!myOpenTicket) return;
      const res = await fetch(`${API_BASE}/tickets/${myOpenTicket.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error(`Failed to leave queue (${res.status})`);
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch (e: any) {
      alert(e.message || "Failed to leave queue");
    }
  };

  if (loading) return <div className="p-6">Loading class…</div>;
  if (err || !cls) return <div className="p-6 text-destructive">Error: {err || "Class not found"}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
          <div className="flex justify-between items-center mb-8">
            {/* Clickable class info */}
            <div
              className="cursor-pointer hover:opacity-80 transition"
              onClick={() => navigate(`/classes/${cls.id}`)}
            >
              <h1 className="text-3xl font-bold text-foreground">
                {cls.department_code} {cls.class_number}
              </h1>
              <p className="text-muted-foreground">{cls.class_name}</p>
              <p className="text-sm text-muted-foreground">
                {(cls.instructor_name || "TBA")} • {cls.semester} {cls.year} • {cls.school}
              </p>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={refreshAll} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <TALogin onLoginSuccess={setUserRole} />
              <UserProfile />
            </div>
          </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Queue Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-queue-waiting mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Line</p>
                      <p className="text-2xl font-bold">{stats?.students_in_queue ?? "—"}</p>
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
                      <p className="text-2xl font-bold">{stats?.students_being_helped ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Est. Wait</p>
                      <p className="text-2xl font-bold">
                        {stats?.estimated_wait_time != null ? `${stats.estimated_wait_time} min` : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Queue List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Queue</CardTitle>
                <CardDescription>Students currently waiting or being helped</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...tickets]
                    .map((t, i) => {
                      // compute a simple position across helping+waiting
                      // helping first (position 1..N), then waiting (continues)
                      let position = 1;
                      const helping = tickets.filter(x => x.status === "being_helped").sort((a, b) => (a.started_help_at || "").localeCompare(b.started_help_at || ""));
                      const waiting = tickets.filter(x => x.status === "waiting").sort((a, b) => a.created_at.localeCompare(b.created_at));
                      const ordered = [...helping, ...waiting, ...tickets.filter(x => x.status !== "being_helped" && x.status !== "waiting")];
                      position = ordered.findIndex(x => x.id === t.id) + 1;

                      // naive per-ticket wait estimate for display
                      const avg = stats?.average_help_time ?? 8;
                      console.log(t)
                      const waitMins = t.status === "waiting" ? timeSince(t.created_at) : 0;

                      return { t, position, waitMins };
                    })
                    .map(({ t, position, waitMins }, index) => (
                      <div key={t.id}>
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <Badge
                                variant={t.status === "being_helped" ? "default" : "secondary"}
                                className={t.status === "being_helped" ? "bg-queue-active" : "bg-queue-waiting"}
                              >
                                #{position}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium">{t.student_name}</p>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                {t.type === "Lab" ? <FlaskConical className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                <span>
                                  {t.type}
                                  {t.subtype ? ` - ${t.subtype}` : ""}
                                </span>
                                <div>{`Location: ${t.location}`}</div>
                              </div>
                              {t.details && <p className="text-sm text-muted-foreground">{t.details}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Timer className="w-3 h-3 mr-1" />
                              {t.status === "waiting" ? `${waitMins} min` : t.status === "being_helped" ? "Now" : "—"}
                            </div>
                            {t.status === "being_helped" && (
                              <Badge variant="outline" className="mt-1 bg-queue-active/10 text-queue-active border-queue-active">
                                Being Helped
                              </Badge>
                            )}
                            {me && t.student_id === me.sub && t.status === "waiting" && (
                              <Button variant="outline" size="sm" className="mt-2" onClick={() => handleEditTicket(t)}>
                                Edit
                              </Button>
                            )}
                            {/* TA-only actions */}
                            {isTA && (
                               <div className="mt-2 flex gap-2 justify-end">
                                {/* Assgin */}
                                {t.status === "waiting" && <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAssign(t)}
                                  disabled={t.status !== "waiting"}
                                  title="Assign to me"
                                >
                                  Assign
                                </Button>}

                                { t.status === "being_helped" && <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReopen(t)}
                                    title="Reopen to Waiting"
                                  >
                                    Reopen
                                  </Button>
                                }

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleClose(t)}
                                  disabled={t.status !== "being_helped"}
                                  title="Mark as Done"
                                >
                                  Close
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancel(t)}
                                  disabled={!(t.status === "waiting" || t.status === "being_helped")}
                                  title="Cancel ticket"
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {index < tickets.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Create Ticket */}
            <Card>
              <CardHeader>
                <CardTitle>Join Queue</CardTitle>
                <CardDescription>
                  {hasUserTicket
                    ? "You have a ticket in the queue. Only one ticket per person allowed."
                    : "Create a new ticket for office hours or lab help"}
                </CardDescription>
              </CardHeader>
              <CardContent>
              <Button
                onClick={() => setShowTicketDialog(true)}   // 👈 open dialog
                className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90"
                size="lg"
                disabled={hasUserTicket || cls?.status === "closed"}
              >
                <Plus className="mr-2 h-5 w-5" />
                {hasUserTicket ? "Already in Queue" : "Create Ticket"}
              </Button>
            </CardContent>
            </Card>

            {/* Your Position (if in queue) */}
            {hasUserTicket && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Position</CardTitle>
                  <CardDescription>You are currently in the queue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{yourPosition ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">in line</p>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Estimated wait: {estimatedForYou != null ? `${estimatedForYou} min` : "—"}</span>
                    <span>{yourPosition ? `${Math.max(0, (yourPosition - 1))} ahead of you` : "—"}</span>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={handleLeaveQueue}>
                    Leave Queue
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Help Time:</span>
                  <span className="text-sm font-medium">{stats?.average_help_time ?? "—"} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queue Status:</span>
                  <Badge className={cls?.status === "active" ? "bg-success" : ""}>{cls?.status ?? "unknown"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated:</span>
                  <span className="text-sm font-medium">Just now</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs left in place; you can wire them to call handleCreateTicket/handleSaveTicket */}
      <TicketCreationDialog
        open={showTicketDialog}
        onOpenChange={setShowTicketDialog}
        classId={cls.id}                 // ✅ pass the class UUID
        onCreate={handleCreateTicket}    // ✅ NEW: dialog will call this with the payload
      />
            <EditTicketDialog open={showEditDialog} onOpenChange={setShowEditDialog} ticket={editingTicket as any} onSave={handleSaveTicket as any} />
    </div>
  );
};

export default ClassQueue;
