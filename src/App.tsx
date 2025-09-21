import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClassQueue from "./pages/ClassQueue";
import Grades from "./pages/Grades";
import Extension from "./pages/Extension";
import StudentProfiles from "./pages/StudentProfiles";
import TAExtensions from "./pages/TAExtensions";
import NotFound from "./pages/NotFound";
import ExtensionsPage from "./pages/ExtensionsPage";
import TAViewCheckoffs from "./pages/TAViewCheckoffs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="//classes/:classId/grades" element={<Grades />} />
          <Route path="/student-profiles" element={<StudentProfiles />} />
          <Route path="/classes/:classId/extension" element={<Extension />} />
          <Route path="/classes/:classId/my-extensions" element={<ExtensionsPage />} />
          <Route path="/classes/:classId/ta-extensions" element={<TAExtensions />} />
          <Route path="/classes/:classId/checkoffs" element={<TAViewCheckoffs />} />
          <Route path="/classes/:classId" element={<ClassQueue />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
