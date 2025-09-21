import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, FileText, LogOut, LogIn } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

type Role = "student" | "ta" | "admin";
type Me = {
  id?: string;
  sub?: string;
  name: string;
  email: string;
  role: Role;
  picture?: string | null;
};

function initialsFrom(name?: string, email?: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
    return (first + last).toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? "U";
  return "U";
}

type UserProfileProps = {
  /** Optional explicit class id (UUID). If not provided, we try to read it from the URL params. */
  classId?: string;
};

const UserProfile = ({ classId }: UserProfileProps) => {
  const navigate = useNavigate();
  const params = useParams<{ classId?: string }>();
  const effectiveClassId = classId ?? params.classId; // 👈 use prop first, else URL

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
        if (!cancelled) {
          if (res.ok) {
            const data: Me = await res.json();
            setMe(data);
          } else {
            setMe(null);
          }
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const userId = me?.id ?? me?.sub ?? "";
  const initials = useMemo(() => initialsFrom(me?.name, me?.email), [me?.name, me?.email]);

  const handleGrades = () => {
    if (effectiveClassId) {
      // If you implement a class-scoped grades page:
      navigate(`/classes/${effectiveClassId}/grades`);
    } else {
      navigate("/grades");
    }
  };

  const handleExtensionPage = () => {
    if (effectiveClassId) {
      navigate(`/classes/${effectiveClassId}/my-extensions`);
    } else {
      navigate("/my-extensions");
    }
  };

  const handleExtension = () => {
    if (effectiveClassId) {
      navigate(`/classes/${effectiveClassId}/extension`);
    } else {
      navigate("/extension");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/");
      window.location.reload();
    } catch (e) {
      console.error("Logout failed:", e);
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE}/login/google`;
  };

  if (loading) {
    return (
      <Button variant="ghost" className="relative h-12 w-12 rounded-full" disabled>
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarFallback>…</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (!me) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-12 w-12 rounded-full" title="Sign in">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                <LogIn className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Welcome</p>
              <p className="text-xs leading-none text-muted-foreground">
                Sign in to access your queue and classes.
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogin} className="cursor-pointer">
            <LogIn className="mr-2 h-4 w-4" />
            <span>Sign in with Google</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-12 rounded-full"
          disabled={isLoggingOut}
          title={`${me.name} (${me.email})`}
        >
          <Avatar className="h-12 w-12 border-2 border-primary/20 hover:border-primary transition-colors">
            {me.picture ? (
              <AvatarImage src={me.picture} alt={me.name} />
            ) : (
              <AvatarImage src="" alt={me.name} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{me.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{me.email}</p>
            <p className="text-xs leading-none text-muted-foreground">Role: {me.role}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* <DropdownMenuItem onClick={handleGrades} className="cursor-pointer">
          <GraduationCap className="mr-2 h-4 w-4" />
          <span>View Grades</span>
        </DropdownMenuItem> */}
        <DropdownMenuItem onClick={handleExtensionPage} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          <span>View Extension</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExtension} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          <span>Request Extension</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive"
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>

        {me?.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/users")} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <span>Manage Users</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
