import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Eye,
  Check,
  X,
  Clock,
  User,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import UserProfile from "@/components/UserProfile";

const API_BASE = 'https://api.bearqueue.com';

type Role = "student" | "ta" | "admin";
type Me = {
  id?: string;
  sub?: string;
  name: string;
  email: string;
  role: Role;
};

type ExtensionStatus = "pending" | "approved" | "rejected" | "cancelled";

type ExtensionRow = {
  id: string;
  class_id: string;

  assignment_type: "homework" | "lab";
  assignment_number: string;
  days_requested: number;
  reason: string;
  group_request: boolean;
  dsps_registered: boolean;

  student_id: string;
  student_name: string;
  student_email?: string | null;

  status: ExtensionStatus;
  approved_by_id?: string | null;
  approved_by_name?: string | null;
  rejected_reason?: string | null;

  created_at: string; // ISO
  updated_at: string; // ISO
};

const TAExtensions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // Optional: filter by class in URL ?class_id=UUID
  const classIdFilter = params.get("class_id") || "";

  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [rows, setRows] = useState<ExtensionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<ExtensionRow | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [taReasoning, setTaReasoning] = useState("");

  // Local UI-only "viewing" set to true for a given id
  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set());

  // --- fetch user (/me) ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
        if (!cancelled) {
          if (res.ok) setMe(await res.json());
          else setMe(null);
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isTA = me?.role === "ta" || me?.role === "admin";

  // --- fetch extensions ---
  const fetchExtensions = async () => {
    setErr(null);
    setLoading(true);
    try {
      const url = classIdFilter
        ? `${API_BASE}/extensions?class_id=${encodeURIComponent(classIdFilter)}`
        : `${API_BASE}/extensions`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to load (${res.status})`);
      }
      const data: ExtensionRow[] = await res.json();
      setRows(data);
    } catch (e: any) {
      setErr(e.message || "Failed to load extensions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIdFilter]);

  // Stats
  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === "pending").length,
    [rows]
  );
  const viewingCount = useMemo(
    () => rows.filter((r) => r.status === "pending" && viewingIds.has(r.id)).length,
    [rows, viewingIds]
  );

  // Open dialog
  const handleViewRequest = (r: ExtensionRow) => {
    setSelected(r);
    setTaReasoning(r.rejected_reason || "");
    setShowDetailDialog(true);
    if (r.status === "pending" && !viewingIds.has(r.id)) {
      setViewingIds((prev) => new Set(prev).add(r.id));
    }
  };

  // PATCH helper
  async function patchExtension(id: string, body: Partial<ExtensionRow>) {
    const res = await fetch(`${API_BASE}/extensions/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Failed to update (${res.status})`);
    }
    return res.json() as Promise<ExtensionRow>;
  }

  const approverId = me?.id ?? me?.sub ?? "";
  const approverName = me?.name ?? "";

  const handleApprove = async () => {
    if (!selected || !isTA) return;
    try {
      await patchExtension(selected.id, {
        status: "approved",
        approved_by_id: approverId,
        approved_by_name: approverName,
        rejected_reason: null,
      });
      setShowDetailDialog(false);
      setSelected(null);
      setTaReasoning("");
      await fetchExtensions();
    } catch (e: any) {
      alert(e.message || "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!selected || !isTA) return;
    try {
      await patchExtension(selected.id, {
        status: "rejected",
        approved_by_id: approverId,
        approved_by_name: approverName,
        rejected_reason: taReasoning || "Rejected",
      });
      setShowDetailDialog(false);
      setSelected(null);
      setTaReasoning("");
      await fetchExtensions();
    } catch (e: any) {
      alert(e.message || "Failed to reject");
    }
  };

  const getStatusBadge = (status: ExtensionStatus, id: string) => {
    const isViewing = status === "pending" && viewingIds.has(id);
    if (isViewing) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
          Viewing
        </Badge>
      );
    }
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loadingMe || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto p-6">Loading…</div>
      </div>
    );
  }
  if (!isTA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto p-6">You must be a TA or admin to view this page.</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto p-6 text-destructive">Error: {err}</div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-foreground">Extension Requests</h1>
              <p className="text-muted-foreground">
                Review and manage student extension requests
                {classIdFilter ? ` • Class: ${classIdFilter}` : ""}
              </p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-warning mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                      <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Eye className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                      <p className="text-2xl font-bold">{viewingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-success mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{rows.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Extension Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Extension Requests</CardTitle>
                <CardDescription>Review student requests for assignment deadline extensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rows.map((r, idx) => (
                    <div key={r.id}>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">{r.student_name}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <FileText className="w-3 h-3" />
                                <span>
                                  {r.assignment_type} {r.assignment_number}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{r.days_requested} days</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusBadge(r.status, r.id)}
                          <Button variant="outline" size="sm" onClick={() => handleViewRequest(r)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                      {idx < rows.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center text-warning">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Review Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Extensions must be submitted before the original deadline</li>
                  <li>Consider circumstances and documentation provided</li>
                  <li>Maximum extension is typically 14 days</li>
                  <li>Provide clear reasoning for decisions</li>
                  <li>DSPS students may have different policies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Extension Request Review</DialogTitle>
              <DialogDescription>Review and decide on this extension request</DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-6 py-4">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Student</Label>
                    <p className="font-medium">{selected.student_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                    <p className="font-medium">{selected.student_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assignment</Label>
                    <p className="font-medium">
                      {selected.assignment_type} {selected.assignment_number}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Days Requested</Label>
                    <p className="font-medium">{selected.days_requested} days</p>
                  </div>
                </div>

                <Separator />

                {/* Reason */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student's Reason</Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selected.reason}</p>
                  </div>
                </div>

                {/* TA Reasoning (used for rejected_reason) */}
                <div>
                  <Label htmlFor="ta-reasoning">TA Reasoning (Optional)</Label>
                  <Textarea
                    id="ta-reasoning"
                    placeholder="Provide reasoning (used as rejected_reason when rejecting)…"
                    value={taReasoning}
                    onChange={(e) => setTaReasoning(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleReject}>
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={handleApprove} className="bg-success hover:bg-success/90">
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TAExtensions;
