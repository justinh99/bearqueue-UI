import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, AlertTriangle, FileText, Calendar } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClassDetail } from "@/class/classDetail";
import { Me } from "@/class/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

const Extension = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const params = new URLSearchParams(location.search);
const [cls, setCls] = useState<ClassDetail | null>(null);


  // Form states
  const [assignmentType, setAssignmentType] = useState<"homework" | "lab" | "">("");
  const [assignmentNumber, setAssignmentNumber] = useState("");
  const [daysRequested, setDaysRequested] = useState("");
  const [reason, setReason] = useState("");
  const [studentId, setStudentId] = useState(""); // optional UX only; backend uses cookie
  const [groupRequest, setGroupRequest] = useState(false);
  const [dspsRegistered, setDspsRegistered] = useState<boolean | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);


  const fetchClass = async () => {
    if (!classId) return;
    const res = await fetch(`${API_BASE}/classes/${classId}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch class (${res.status})`);
    setCls(await res.json());
  };


  const fetchMe = async () => {
    const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
    if (res.ok) setMe(await res.json());
    else setMe(null);
  };


  const refreshAll = async () => {
    setErr(null);
    try {
      await Promise.all([fetchMe(), fetchClass()]);
    } catch (e: any) {
      setErr(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // (Optional) fetch class for header context
  const [className, setClassName] = useState<string>("");


  useEffect(() => {
    setLoading(true);
    refreshAll();
  }, [classId]);

  const isFormValid = () => {
    return (
      !!classId &&
      !!assignmentType &&
      !!assignmentNumber &&
      !!daysRequested &&
      !!reason.trim() &&
      dspsRegistered !== null
      // studentId not required by API; leave it optional for UI
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    try {
      const res = await fetch(`${API_BASE}/extensions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classId, // ✅ real class UUID from route
          assignment_type: assignmentType,
          assignment_number: assignmentNumber,
          days_requested: Number(daysRequested),
          reason,
          group_request: assignmentType === "lab" ? groupRequest : false,
          dsps_registered: dspsRegistered,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to submit (${res.status})`);
      }

      setShowConfirmDialog(false);
      navigate(-1);
    } catch (e: any) {
      alert(e.message || "Failed to submit extension request");
    }
  };

  if (!classId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Missing classId in the route.</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5"><div className="container mx-auto p-6">Loading…</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
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
              <h1 className="text-3xl font-bold text-foreground">Request Extension</h1>
              <p className="text-muted-foreground">
                {className ? `For ${className}` : "Submit a request for assignment deadline extension"}
              </p>
            </div>
          </div>
          <UserProfile />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-primary" />
                  Extension Request Form
                </CardTitle>
                <CardDescription>
                  Please provide accurate information. No changes can be made after submission.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assignment Type */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Assignment Type</Label>
                  <RadioGroup
                    value={assignmentType}
                    onValueChange={(value) => setAssignmentType(value as "homework" | "lab")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="homework" id="homework-ext" />
                      <Label htmlFor="homework-ext" className="flex items-center cursor-pointer">
                        <FileText className="w-5 h-5 mr-2 text-primary" />
                        Homework
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="lab" id="lab-ext" />
                      <Label htmlFor="lab-ext" className="flex items-center cursor-pointer">
                        <Calendar className="w-5 h-5 mr-2 text-secondary" />
                        Lab
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Assignment Number */}
                <div className="space-y-2">
                  <Label htmlFor="assignment-number">
                    {assignmentType === "homework" ? "Homework" : "Lab"} Number
                  </Label>
                  <Input
                    id="assignment-number"
                    placeholder={assignmentType === "homework" ? "Ex: 5" : "Ex: 3"}
                    value={assignmentNumber}
                    onChange={(e) => setAssignmentNumber(e.target.value)}
                  />
                </div>

                {/* Days Requested */}
                <div className="space-y-2">
                  <Label htmlFor="days-requested">Days Requested (beyond original due date)</Label>
                  <Input
                    id="days-requested"
                    type="number"
                    min="1"
                    max="14"
                    placeholder="Ex: 3"
                    value={daysRequested}
                    onChange={(e) => setDaysRequested(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum 14 days allowed</p>
                </div>

                {/* Student ID (optional; not sent) */}
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student ID (optional)</Label>
                  <Input
                    id="student-id"
                    placeholder="Your UC Berkeley Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>

                {/* Group Request (Lab only) */}
                {assignmentType === "lab" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="group-request"
                        checked={groupRequest}
                        onCheckedChange={(checked) => setGroupRequest(Boolean(checked))}
                      />
                      <Label htmlFor="group-request" className="text-sm">
                        Another group member has already submitted a request for this lab
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Only one extension request is needed per team</p>
                  </div>
                )}

                {/* DSPS Registration */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">DSPS Registration</Label>
                  <RadioGroup
                    value={dspsRegistered === null ? "" : dspsRegistered.toString()}
                    onValueChange={(value) => setDspsRegistered(value === "true")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="dsps-yes" />
                      <Label htmlFor="dsps-yes">Yes, I am registered with DSPS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="dsps-no" />
                      <Label htmlFor="dsps-no">No, I am not registered with DSPS</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Extension</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed explanation for your extension request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Be specific about your circumstances</p>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90"
                        disabled={!isFormValid()}
                      >
                        Submit Extension Request
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                          Confirm Submission
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>Please confirm that all information provided is current and accurate.</p>
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <p className="text-sm text-destructive font-medium">
                              ⚠️ Important: Extensions are not guaranteed and any request submitted after the original
                              deadline will not be approved under any circumstances.
                            </p>
                          </div>
                          <p className="text-sm">No changes can be made after submission.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                          Submit Request
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Assignment Type</p>
                  <p className="font-medium">{assignmentType || "Not selected"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assignment Number</p>
                  <p className="font-medium">{assignmentNumber || "Not entered"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Requested</p>
                  <p className="font-medium">{daysRequested || "Not entered"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DSPS Registered</p>
                  <p className="font-medium">
                    {dspsRegistered === null ? "Not selected" : dspsRegistered ? "Yes" : "No"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center text-warning">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Extension requests must be submitted before the original deadline</li>
                  <li>Extensions are evaluated on a case-by-case basis</li>
                  <li>Only one request per team is needed for lab assignments</li>
                  <li>DSPS students may have different extension policies</li>
                  <li>No changes can be made after submission</li>
                </ul>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>If you have questions about extension policies:</p>
                <p className="font-medium">Email: course-staff@berkeley.edu</p>
                <p className="font-medium">Office Hours: Mon-Fri 9AM-5PM</p>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Extension;
