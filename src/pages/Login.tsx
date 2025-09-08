import { useState } from "react";
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
import { ChromeIcon, ChevronDown, UserCheck, GraduationCap } from "lucide-react";

const Login = () => {
  const [loginType, setLoginType] = useState<'student' | 'ta'>('student');
  const [taCredentials, setTaCredentials] = useState({ username: "", password: "" });

  const handleGoogleLogin = () => {
    // Mock login for demo
    window.location.href = '/dashboard';
  };

  const handleTALogin = () => {
    // Mock TA login - in real app, verify credentials
    if (taCredentials.username && taCredentials.password) {
      window.location.href = '/dashboard';
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
            {loginType === 'student' 
              ? "Sign in with your Google account to access the queue system"
              : "Enter your TA credentials to access administrative features"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login Type Dropdown */}
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-48">
                  {loginType === 'student' ? (
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
                <DropdownMenuItem onClick={() => setLoginType('student')}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Student Login
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLoginType('ta')}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  TA Login
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Student Login */}
          {loginType === 'student' && (
            <>
              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-300"
                size="lg"
              >
                <ChromeIcon className="mr-3 h-5 w-5" />
                Continue with Google
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Only UC Berkeley accounts are allowed
              </p>
            </>
          )}

          {/* TA Login */}
          {loginType === 'ta' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ta-username">Username</Label>
                <Input
                  id="ta-username"
                  placeholder="TA Username"
                  value={taCredentials.username}
                  onChange={(e) => setTaCredentials(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ta-password">Password</Label>
                <Input
                  id="ta-password"
                  type="password"
                  placeholder="Password"
                  value={taCredentials.password}
                  onChange={(e) => setTaCredentials(prev => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleTALogin()}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;