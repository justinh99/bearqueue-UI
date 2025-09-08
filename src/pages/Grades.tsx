import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserProfile from "@/components/UserProfile";

const Grades = () => {
  const navigate = useNavigate();

  // Mock grade data
  const gradeData = {
    student: {
      name: "John Doe",
      studentId: "12345678",
      email: "john.doe@berkeley.edu"
    },
    overall: {
      percentage: 87.5,
      letterGrade: "A-",
      classRank: 15,
      totalStudents: 120
    },
    categories: [
      {
        name: "Homework",
        weight: 30,
        points: 285,
        totalPoints: 300,
        percentage: 95.0,
        letterGrade: "A"
      },
      {
        name: "Labs",
        weight: 25,
        points: 195,
        totalPoints: 250,
        percentage: 78.0,
        letterGrade: "B+"
      },
      {
        name: "Midterm 1",
        weight: 20,
        points: 82,
        totalPoints: 100,
        percentage: 82.0,
        letterGrade: "B-"
      },
      {
        name: "Midterm 2",
        weight: 25,
        points: 91,
        totalPoints: 100,
        percentage: 91.0,
        letterGrade: "A-"
      }
    ],
    recentGrades: [
      {
        assignment: "HW 8",
        category: "Homework",
        points: 48,
        totalPoints: 50,
        percentage: 96.0,
        dateGraded: "2024-01-15"
      },
      {
        assignment: "Lab 6 Check-off",
        category: "Labs", 
        points: 25,
        totalPoints: 25,
        percentage: 100.0,
        dateGraded: "2024-01-12"
      },
      {
        assignment: "HW 7",
        category: "Homework",
        points: 42,
        totalPoints: 50,
        percentage: 84.0,
        dateGraded: "2024-01-08"
      }
    ]
  };

  const getLetterGradeColor = (letterGrade: string) => {
    if (letterGrade.startsWith('A')) return 'bg-success';
    if (letterGrade.startsWith('B')) return 'bg-primary';
    if (letterGrade.startsWith('C')) return 'bg-warning';
    return 'bg-destructive';
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
              <h1 className="text-3xl font-bold text-foreground">Grade Report</h1>
              <p className="text-muted-foreground">View your current grades and progress</p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Overall Grade */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-6 h-6 mr-2 text-primary" />
                  Overall Grade
                </CardTitle>
                <CardDescription>Your current standing in the class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {gradeData.overall.percentage}%
                    </div>
                    <p className="text-sm text-muted-foreground">Current Average</p>
                  </div>
                  <div className="text-center">
                    <Badge 
                      className={`text-2xl font-bold px-4 py-2 ${getLetterGradeColor(gradeData.overall.letterGrade)}`}
                    >
                      {gradeData.overall.letterGrade}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">Letter Grade</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary mb-2">
                      #{gradeData.overall.classRank}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      of {gradeData.overall.totalStudents} students
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grade Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-secondary" />
                  Grade Breakdown
                </CardTitle>
                <CardDescription>Performance by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {gradeData.categories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.points}/{category.totalPoints} points ({category.weight}% of grade)
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getLetterGradeColor(category.letterGrade)} mb-1`}>
                            {category.letterGrade}
                          </Badge>
                          <p className="text-sm font-medium">{category.percentage}%</p>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-success" />
                  Recent Grades
                </CardTitle>
                <CardDescription>Your latest graded assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeData.recentGrades.map((grade, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{grade.assignment}</p>
                        <p className="text-sm text-muted-foreground">{grade.category}</p>
                        <p className="text-xs text-muted-foreground">
                          Graded on {new Date(grade.dateGraded).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{grade.points}/{grade.totalPoints}</p>
                        <p className="text-sm text-muted-foreground">{grade.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{gradeData.student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-medium">{gradeData.student.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{gradeData.student.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>How you compare to your peers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">A grades:</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">B grades:</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">C grades:</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">D/F grades:</span>
                    <span className="font-medium">5%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-medium">
                      <span>Class Average:</span>
                      <span>82.3%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/extension')}
                >
                  Request Extension
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  Print Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grades;