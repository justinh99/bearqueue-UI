import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Eye, Check, X, Clock, User, Calendar, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import UserProfile from "@/components/UserProfile";
import { ClassDetail } from "@/class/classDetail";
import { useDebounce } from "@/hooks/useDebounce";

const API_BASE = import.meta.env.VITE_API_BASE as string;

type Role = "student" | "ta" | "admin";
type Me = { id?: string; sub?: string; name: string; email: string; role: Role; };

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
  created_at: string;
  updated_at: string;
};


export default function ExtensionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const { classId } = useParams<{ classId: string }>();
  const classIdFilter = params.get("class_id") || "";

  const [me, setMe] = useState<Me | null>(null);

  const [rows, setRows] = useState<ExtensionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Shared dialog state (review)
  const [selected, setSelected] = useState<ExtensionRow | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [taReasoning, setTaReasoning] = useState("");

  // Student edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editAssignmentNumber, setEditAssignmentNumber] = useState("");
  const [editDays, setEditDays] = useState<number>(1);
  const [editReason, setEditReason] = useState("");

  const [fType, setFType] = useState<""|"homework"|"lab">("");
  const [fNumber, setFNumber] = useState("");
  const [fDsps, setFDsps] = useState<""|"true"|"false">("");
  const [fName, setFName] = useState("");     // TA-only
  const [fEmail, setFEmail] = useState("");   // TA-only

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); 
  const [total, setTotal] = useState(0);

  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isTA = me?.role === "ta" || me?.role === "admin";
  const approverId = me?.id ?? me?.sub ?? "";
  const approverName = me?.name ?? "";
  // Build list URL by role
  const listUrl = useMemo(() => {
    const url = new URL(`${API_BASE}/extensions`);
    if (classIdFilter) url.searchParams.set("class_id", classIdFilter);
    if (fType) url.searchParams.set("assignment_type", fType);
    if (fNumber) url.searchParams.set("assignment_number", fNumber);
    if (fDsps) url.searchParams.set("dsps_registered", fDsps);
    if (isTA && fName) url.searchParams.set("student_name", fName);
    if (isTA && fEmail) url.searchParams.set("student_email", fEmail);
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(pageSize));
    return url.toString();
  }, [isTA, classIdFilter, fType, fNumber, fDsps, fName, fEmail, page, pageSize]);


  const debouncedListUrl = useDebounce(listUrl, 500);


  const refreshAll = async () => {
    setErr(null);
    try {
      await Promise.all([fetchMe(), fetchClass(), fetchExtensions()]);
    } catch (e: any) {
      setErr(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async () => {
    const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
    if (res.ok) setMe(await res.json());
    else setMe(null);
  };


  const fetchExtensions = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(listUrl, { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json(); // { items, total, page, page_size }
      setRows(data.items);
      setTotal(data.total);
      // (You already track page/pageSize in state)
    } catch (e: any) {
      setErr(e.message || "Failed to load extensions");
    } finally {
      setLoading(false);
    }
  };

  const fetchClass = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch class (${res.status})`);
    setCls(await res.json());
  };


  useEffect(() => {
    setLoading(true);
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedListUrl]);

  const pendingCount = useMemo(() => rows.filter(r => r.status === "pending").length, [rows]);
  const viewingCount = useMemo(() => rows.filter(r => r.status === "pending" && viewingIds.has(r.id)).length, [rows, viewingIds]);

  function getStatusBadge(r: ExtensionRow) {
    if (r.status === "pending" && viewingIds.has(r.id)) {
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary">Viewing</Badge>;
    }
    switch (r.status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{r.status}</Badge>;
    }
  }

  async function patchExtension(id: string, body: Partial<ExtensionRow>) {
    const res = await fetch(`${API_BASE}/extensions/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<ExtensionRow>;
  }

  // TA/Admin actions
  const handleViewRequest = (r: ExtensionRow) => {
    setSelected(r);
    setTaReasoning(r.rejected_reason || "");
    setShowDetailDialog(true);
    if (r.status === "pending") {
      setViewingIds(prev => new Set(prev).add(r.id));
    }
  };
  const handleApprove = async () => {
    if (!selected || !isTA) return;
    await patchExtension(selected.id, { status: "approved", approved_by_id: approverId, approved_by_name: approverName, rejected_reason: null });
    setShowDetailDialog(false);
    setSelected(null);
    setTaReasoning("");
    fetchExtensions();
  };
  const handleReject = async () => {
    if (!selected || !isTA) return;
    await patchExtension(selected.id, { status: "rejected", approved_by_id: approverId, approved_by_name: approverName, rejected_reason: taReasoning || "Rejected" });
    setShowDetailDialog(false);
    setSelected(null);
    setTaReasoning("");
    fetchExtensions();
  };

  // Student actions
  const canStudentEdit = (r: ExtensionRow) => !isTA && r.status === "pending" && (me?.sub && r.student_id === me.sub);
  const handleOpenEdit = (r: ExtensionRow) => {
    setSelected(r);
    setEditAssignmentNumber(r.assignment_number);
    setEditDays(r.days_requested);
    setEditReason(r.reason);
    setEditOpen(true);
  };
  const handleSaveEdit = async () => {
    if (!selected) return;
    await patchExtension(selected.id, {
      assignment_number: editAssignmentNumber,
      days_requested: editDays,
      reason: editReason,
    });
    setEditOpen(false);
    setSelected(null);
    fetchExtensions();
  };
  const handleCancelRequest = async (r: ExtensionRow) => {
    if (!canStudentEdit(r)) return;
    await patchExtension(r.id, { status: "cancelled" });
    fetchExtensions();
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5"><div className="container mx-auto p-6">Loading…</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isTA ? "Extension Requests" : "My Extensions"}
              </h1>
              <p className="text-muted-foreground">
                {isTA ? "Review and manage student extension requests" : "View and update your submitted extension requests"}
                {classIdFilter ? ` • Class: ${classIdFilter}` : ""}
              </p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-warning mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{isTA ? "Pending Review" : "My Pending"}</p>
                      <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {isTA && (
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
              )}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-success mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total {isTA ? "Requests" : "My Requests"}</p>
                      <p className="text-2xl font-bold">{rows.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Refine extension requests</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-6">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select
                    className="border rounded-md h-9 px-2"
                    value={fType}
                    onChange={(e) => { setPage(1); setFType(e.target.value as any); }}
                  >
                    <option value="">Any</option>
                    <option value="homework">Homework</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Number</Label>
                  <Input
                    value={fNumber}
                    onChange={(e) => { setPage(1); setFNumber(e.target.value); }}
                    placeholder="e.g. 3"
                  />
                </div>
                {isTA && (
                  <>
                    <div className="space-y-1">
                      <Label>DSPS</Label>
                      <select
                        className="w-full h-10 border rounded-md h-9 px-2"
                        value={fDsps}
                        onChange={(e) => { setPage(1); setFDsps(e.target.value as any); }}
                      >
                        <option value="">Any</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input
                        value={fName}
                        onChange={(e) => { setPage(1); setFName(e.target.value); }}
                        placeholder="Student Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        value={fEmail}
                        onChange={(e) => { setPage(1); setFEmail(e.target.value); }}
                        placeholder="Student Email"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label>Page size</Label>
                  <select
                    className="w-full h-10 border rounded-md px-2 text-sm"
                    value={pageSize}
                    onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                  >
                    {[10, 20, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>


            {/* List */}
            <Card>
              <CardHeader>
                <CardTitle>{isTA ? "Extension Requests" : "Your Extension Requests"}</CardTitle>
                <CardDescription>{isTA ? "Review student requests" : "You can edit/cancel while status is pending"}</CardDescription>
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
                            <p className="font-medium">
                              {isTA ? r.student_name : `${r.assignment_type} ${r.assignment_number}`}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {isTA && (
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{r.assignment_type} {r.assignment_number}</span>
                                </div>
                              )}
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
                          {getStatusBadge(r)}
                          {isTA ? (
                            <Button variant="outline" size="sm" onClick={() => handleViewRequest(r)}>
                              <Eye className="w-4 h-4 mr-1" /> Review
                            </Button>
                          ) : (
                            r.status === "pending" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(r)}>
                                  <Pencil className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleCancelRequest(r)}>
                                  <Trash2 className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </>
                            )
                          )}
                        </div>
                      </div>
                      {idx < rows.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>


                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} / {totalPages} • {total} result{total === 1 ? "" : "s"}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
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
                  {isTA ? "Review Guidelines" : "Notes"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-2 list-disc list-inside">
                  <li>{isTA ? "Provide clear reasoning for decisions" : "You can edit/cancel while pending"}</li>
                  <li>Extensions are typically capped (e.g., 14 days)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* TA Review Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Extension Request Review</DialogTitle>
              <DialogDescription>Review and decide on this extension request</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Student</Label>
                    <p className="font-medium">{selected.student_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Student ID</Label>
                    <p className="font-medium">{selected.student_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Assignment</Label>
                    <p className="font-medium">{selected.assignment_type} {selected.assignment_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Days Requested</Label>
                    <p className="font-medium">{selected.days_requested} days</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm text-muted-foreground">Student's Reason</Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selected.reason}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ta-reasoning">TA Reasoning (Optional)</Label>
                  <Textarea id="ta-reasoning" value={taReasoning} onChange={(e) => setTaReasoning(e.target.value)} rows={3} className="mt-2" />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReject}><X className="w-4 h-4 mr-2" />Reject</Button>
                  <Button onClick={handleApprove} className="bg-success hover:bg-success/90"><Check className="w-4 h-4 mr-2" />Approve</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Student Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Extension (Pending)</DialogTitle>
              <DialogDescription>You may update details while the request is pending.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Assignment Number</Label>
                <Input value={editAssignmentNumber} onChange={(e) => setEditAssignmentNumber(e.target.value)} />
              </div>
              <div>
                <Label>Days Requested</Label>
                <Input type="number" min={1} max={14} value={editDays} onChange={(e) => setEditDays(Number(e.target.value || 1))} />
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea rows={3} value={editReason} onChange={(e) => setEditReason(e.target.value)} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
