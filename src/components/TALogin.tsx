import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, GraduationCap, FileText, LogOut, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;

type Role = "student" | "ta" | "admin";
type Me = {
  id: string;
  email: string;
  name: string;
  role: Role;
  sub?: string;
};

interface TALoginProps {
  onLoginSuccess: (role: "student" | "ta") => void;
}

const TALogin = ({ onLoginSuccess }: TALoginProps) => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>(); // <-- grab classId from /classes/:classId
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
        if (res.ok) {
          const data: Me = await res.json();
          setMe(data);
          onLoginSuccess(data.role === "ta" ? "ta" : "student");
        } else {
          setMe(null);
          onLoginSuccess("student");
        }
      } catch {
        setMe(null);
        onLoginSuccess("student");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      // After logout, go to login (or /)
      navigate("/login");
    }
  };

  const handleStudentProfile = () => {
    if (classId) navigate(`/classes/${classId}/student-profiles`);
    else navigate("/student-profiles");
  };

  const handleCheckoffs = () => {
    if (classId) navigate(`/classes/${classId}/checkoffs`);
    else navigate("/student-profiles");
  };

  const handleGrades = () => {
    if (classId) navigate(`/classes/${classId}/grades`);
    else navigate("/grades");
  };

  const handleExtensions = () => {
    // <-- This is what you asked for
    if (classId) navigate(`/classes/${classId}/ta-extensions`);
    else navigate("/ta-extensions"); // fallback if not on a class page
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading…
      </Button>
    );
  }

  if (!me) {
    return (
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">TA Tools</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>TA Tools</DialogTitle>
            <DialogDescription>
              Sign in with your Google account, and make sure your account has a TA role to access these features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => (window.location.href = `${API_BASE}/login/google`)}>
              Sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (me.role !== "ta") {
    return (
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">TA Tools</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>TA Access Required</DialogTitle>
            <DialogDescription>
              You are signed in as <b>{me.name}</b> ({me.email}) with role <b>{me.role}</b>.<br />
              TA tools are only available to users with the <b>TA</b> role. If this is a mistake,
              contact the course admin to update your role.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowInfo(false)}>Close</Button>
            <Button variant="destructive" onClick={handleLogout}>Log out</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="default" className="bg-ta-primary text-white">TA</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full" title="TA Menu">
            <UserCheck className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">TA Dashboard</p>
              <p className="text-xs leading-none text-muted-foreground">{me.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{me.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* <DropdownMenuItem onClick={handleStudentProfile} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Student Profiles</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGrades} className="cursor-pointer">
            <GraduationCap className="mr-2 h-4 w-4" />
            <span>Manage Grades</span>
          </DropdownMenuItem> */}
          <DropdownMenuItem onClick={handleExtensions} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Review Extension Requests</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCheckoffs} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>View Check Off</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TALogin;
