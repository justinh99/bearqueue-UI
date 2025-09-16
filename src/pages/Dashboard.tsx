import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

type ClassItem = {
  id: string;
  school: string;
  department_code: string;
  class_number: string;
  class_name: string;
  semester: "Spring" | "Summer" | "Fall" | "Winter";
  year: number;
  instructor_name?: string | null;
  status: "active" | "closed";
  students_in_queue: number;
  average_wait_time?: string | null;
};

const API_BASE = 'http://localhost:8000'

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Load current user (cookie-based session)
  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { method: "GET", credentials: "include" });
        setUser(res.ok ? await res.json() : null);
      } catch (e) {
        console.error("Failed to fetch /me:", e);
        setUser(null);
      } finally {
        setLoadingMe(false);
      }
    };
    getMe();
  }, []);

  // Load classes
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/classes`, {
          method: "GET",
          credentials: "include", // okay if public; required if you later protect it
        });
        if (!res.ok) throw new Error(`Failed to fetch classes (${res.status})`);
        const data: ClassItem[] = await res.json();
        setClasses(data);
      } catch (e: any) {
        setErr(e.message || "Failed to load classes");
      } finally {
        setLoadingClasses(false);
      }
    };
    load();
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_BASE}/login/google`;
  };

  const handleClassClick = (id: string) => {
    navigate(`/classes/${id}`); // use UUID route
  };

  if (loadingMe || loadingClasses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to BearQueue</h1>
          <p className="text-muted-foreground">Please log in with your Berkeley Google account to continue.</p>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleLogin}>
            Login with Google
          </Button>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <p className="text-destructive">Error: {err}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back{user.name ? `, ${user.name}` : ""}! Select a class to join the queue.
            </p>
          </div>
          <UserProfile />
        </div>

        {/* Classes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => handleClassClick(cls.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {cls.department_code} {cls.class_number}
                    </CardTitle>
                    <CardDescription className="mt-1">{cls.class_name}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(cls.instructor_name || "TBA")} • {cls.semester} {cls.year}
                    </p>
                    <p className="text-xs text-muted-foreground">{cls.school}</p>
                  </div>
                  <Badge variant={cls.status === "active" ? "default" : "secondary"}>
                    {cls.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">{cls.students_in_queue}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">{cls.average_wait_time ?? "—"}</span>
                    </div>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90" disabled={cls.status === "closed"}>
                    <BookOpen className="w-4 h-4 mr-1" />
                    Enter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {classes.length === 0 && (
            <div className="text-sm text-muted-foreground p-2">No classes yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
