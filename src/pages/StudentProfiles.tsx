import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Plus, 
  User, 
  GraduationCap,
  Mail,
  IdCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserProfile from "@/components/UserProfile";

const StudentProfiles = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    studentId: "",
    course: "ME 100"
  });

  // Define proper type
  interface Student {
    id: string;
    name: string;
    email: string;
    course: string;
    status: "active" | "inactive";
    grades: Record<string, number>;
  }

  // Mock student data
  const [students, setStudents] = useState<Student[]>([
    {
      id: "12345678",
      name: "Alice Chen",
      email: "alice.chen@berkeley.edu",
      course: "ME 100",
      status: "active",
      grades: { hw1: 95, hw2: 88, lab1: 92 }
    },
    {
      id: "87654321",
      name: "Bob Johnson", 
      email: "bob.johnson@berkeley.edu",
      course: "ME 100",
      status: "active",
      grades: { hw1: 78, hw2: 85, lab1: 90 }
    },
    {
      id: "11223344",
      name: "Carol Davis",
      email: "carol.davis@berkeley.edu",
      course: "ME 100", 
      status: "active",
      grades: { hw1: 92, hw2: 90, lab1: 88 }
    }
  ]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.includes(searchTerm)
  );

  const handleAddStudent = () => {
    if (newStudent.name && newStudent.email && newStudent.studentId) {
      const student: Student = {
        id: newStudent.studentId,
        name: newStudent.name,
        email: newStudent.email,
        course: newStudent.course,
        status: "active",
        grades: {}
      };
      setStudents(prev => [...prev, student]);
      setNewStudent({ name: "", email: "", studentId: "", course: "ME 100" });
      setShowAddStudent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Student Profiles</h1>
              <p className="text-muted-foreground">Manage course enrollment and student information</p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Add */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="w-6 h-6 mr-2 text-primary" />
                      Course Enrollment
                    </CardTitle>
                    <CardDescription>
                      View and manage students enrolled in your courses
                    </CardDescription>
                  </div>
                  <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                          Add a student to the course enrollment.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="student-name">Full Name</Label>
                          <Input
                            id="student-name"
                            placeholder="Student's full name"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-email">Email</Label>
                          <Input
                            id="student-email"
                            type="email"
                            placeholder="student@berkeley.edu"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-id">Student ID</Label>
                          <Input
                            id="student-id"
                            placeholder="Student ID number"
                            value={newStudent.studentId}
                            onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddStudent(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddStudent}
                          disabled={!newStudent.name || !newStudent.email || !newStudent.studentId}
                        >
                          Add Student
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="space-y-4">
                  {filteredStudents.map((student, index) => (
                    <div key={student.id}>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{student.email}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <IdCard className="w-3 h-3" />
                                <span>{student.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-success/10 text-success border-success">
                            {student.status}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/grades?student=${student.id}`)}
                          >
                            <GraduationCap className="w-4 h-4 mr-1" />
                            View Grades
                          </Button>
                        </div>
                      </div>
                      {index < filteredStudents.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Students:</span>
                  <span className="text-sm font-medium">{students.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active:</span>
                  <span className="text-sm font-medium">{students.filter(s => s.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Course:</span>
                  <span className="text-sm font-medium">ME 100</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/grades')}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Manage All Grades
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/ta-extensions')}>
                  <Mail className="w-4 h-4 mr-2" />
                  Extension Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfiles;