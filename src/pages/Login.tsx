import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Chrome, ChevronDown, UserCheck, GraduationCap, XCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function mapError(code?: string) {
  switch (code) {
    case "missing_email":
      return "We couldn’t read your email from Google. Please try again.";
    case "unauthorized_domain":
      return "This account is not allowed. Use a @berkeley.edu email, or ask staff to whitelist your address.";
    default:
      return null;
  }
}

const Login = () => {
  const [loginType, setLoginType] = useState<"student" | "ta">("student");
  const [taCredentials, setTaCredentials] = useState({ username: "", password: "" });

  // read and clear ?error for one-time display
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const errorCode = params.get("error") ?? undefined;
  const errorMessage = useMemo(() => mapError(errorCode), [errorCode]);
  useEffect(() => {
    if (!errorCode) return;
    const next = new URL(window.location.href);
    next.searchParams.delete("error");
    navigate({ pathname: next.pathname, search: next.search }, { replace: true });
  }, [errorCode, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/login/google`;
  };

  const handleTALogin = () => {
    // TODO: wire to a real TA auth endpoint if you add one.
    if (taCredentials.username && taCredentials.password) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">BQ</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to BearQueue</CardTitle>
          <CardDescription>
            {loginType === "student"
              ? "Sign in with your Google account to access the queue system"
              : "Enter your TA credentials to access administrative features"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="border-destructive/30">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Sign-in error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Login Type Dropdown */}
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-48">
                  {loginType === "student" ? (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Student Login
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      TA Login
                    </>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => setLoginType("student")}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Student Login
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLoginType("ta")}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  TA Login
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Student Login */}
          {loginType === "student" && (
            <>
              <Button
                onClick={handleGoogleLogin}
                className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-300"
                size="lg"
              >
                <Chrome className="mr-3 h-5 w-5" />
                Continue with Google
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Only UC Berkeley accounts are allowed (contact staff to whitelist otherwise).
              </p>
            </>
          )}

          {/* TA Login (placeholder/manual) */}
          {loginType === "ta" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ta-username">Username</Label>
                <Input
                  id="ta-username"
                  placeholder="TA Username"
                  value={taCredentials.username}
                  onChange={(e) =>
                    setTaCredentials((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ta-password">Password</Label>
                <Input
                  id="ta-password"
                  type="password"
                  placeholder="Password"
                  value={taCredentials.password}
                  onChange={(e) =>
                    setTaCredentials((prev) => ({ ...prev, password: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleTALogin()}
                />
              </div>
              <Button
                onClick={handleTALogin}
                disabled={!taCredentials.username || !taCredentials.password}
                className="w-full h-12 text-lg font-medium"
                size="lg"
              >
                Login as TA
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                (This is a placeholder. Wire to a real TA auth endpoint when ready.)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
