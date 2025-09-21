// src/pages/AdminUsers.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserProfile from "@/components/UserProfile";
import { AlertTriangle, Edit, Save, X, Shield } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE;

type Role = "student" | "ta" | "admin";
type Me = { sub?: string; id?: string; name: string; email: string; role: Role };
type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  picture?: string | null;
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Role>("student");
  const [saving, setSaving] = useState(false);

  // load me
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (alive) setMe(data);
        } else if (alive) setMe(null);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // guard route: admin only
  const isAdmin = me?.role === "admin";
  useEffect(() => {
    if (!loadingMe && !isAdmin) {
      navigate("/"); // or a 403 page
    }
  }, [loadingMe, isAdmin, navigate]);

  // fetch users
  const fetchUsers = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/users`);
      if (query) url.searchParams.set("q", query);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const filtered = useMemo(() => {
    const list = users ?? [];
    if (!q.trim()) return list;
    const qq = q.trim().toLowerCase();
    return list.filter(u => (u.name?.toLowerCase().includes(qq) || u.email?.toLowerCase().includes(qq)));
  }, [users, q]);

  const startEdit = (u: User) => {
    setEditing(u);
    setEditName(u.name || "");
    setEditRole(u.role);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName("");
    setEditRole("student");
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          role: editRole, // email not sent (immutable)
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      cancelEdit();
    } catch (e: any) {
      setError(e.message || "Failed to save user");
      setSaving(false);
    }
  };

  if (!isAdmin) {
    // brief guard while we fetch /me
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Admins can manage user names and roles. Email is immutable.</p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Search and edit users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Search by name or email…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => fetchUsers(q)}>Search</Button>
                  <Button variant="ghost" onClick={() => { setQ(""); fetchUsers(); }}>Clear</Button>
                </div>

                {error && (
                  <div className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((u, idx) => (
                      <div key={u.id}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/40 transition-colors">
                          <div>
                            <p className="font-medium">{u.name || "(no name)"} <span className="text-muted-foreground">• {u.email}</span></p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Role:</span>
                              <Badge variant="outline">{u.role}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                          </div>
                        </div>
                        {idx < filtered.length - 1 && <Separator className="my-1" />}
                      </div>
                    ))}
                    {!filtered.length && (
                      <div className="text-sm text-muted-foreground">No users found.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>• Only admins can access this page.</p>
                <p>• Email cannot be changed.</p>
                <p>• Consider limiting admin role changes to trusted staff.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit dialog */}
        <Dialog open={!!editing} onOpenChange={(o) => !saving && !o && cancelEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div>
                  <Label>Email (read-only)</Label>
                  <Input value={editing.email} disabled className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">student</SelectItem>
                      <SelectItem value="ta">ta</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button onClick={saveEdit} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}
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

export default AdminUsers;
