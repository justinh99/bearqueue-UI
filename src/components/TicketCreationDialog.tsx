import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { BookOpen, FlaskConical, Users, HelpCircle } from "lucide-react";

const API_BASE = 'https://api.bearqueue.com'

interface TicketCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;                         // ✅ add: which class to post to
  onCreated?: (ticket: any) => void;       // ✅ optional: callback after success
}

const TicketCreationDialog = ({ open, onOpenChange, classId, onCreated }: TicketCreationDialogProps) => {
  const [ticketType, setTicketType] = useState<"OH" | "Lab" | "">("");
  const [ohType, setOhType] = useState<"homework" | "general" | "">("");
  const [labType, setLabType] = useState<"checkoff" | "question" | "">("");

  // Form states
  const [homeworkNumber, setHomeworkNumber] = useState("");
  const [questionNumber, setQuestionNumber] = useState("");
  const [generalQuestion, setGeneralQuestion] = useState("");
  const [labNumber, setLabNumber] = useState("");
  const [labPrompt, setLabPrompt] = useState("");
  const [workstation, setWorkstation] = useState("");
  const [teammate1, setTeammate1] = useState("");
  const [teammate1Email, setTeammate1Email] = useState("");
  const [teammate2, setTeammate2] = useState("");
  const [teammate2Email, setTeammate2Email] = useState("");
  const [teammate3, setTeammate3] = useState("");
  const [teammate3Email, setTeammate3Email] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setTicketType("");
    setOhType("");
    setLabType("");
    setHomeworkNumber("");
    setQuestionNumber("");
    setGeneralQuestion("");
    setLabNumber("");
    setLabPrompt("");
    setWorkstation("");
    setTeammate1("");
    setTeammate1Email("");
    setTeammate2("");
    setTeammate2Email("");
    setTeammate3("");
    setTeammate3Email("");
    setErrorMsg(null);
  };

  const isFormValid = () => {
    if (!ticketType) return false;

    if (ticketType === "OH") {
      if (!ohType) return false;
      if (ohType === "homework" && (!homeworkNumber || !questionNumber)) return false;
      if (ohType === "general" && !generalQuestion) return false;
    }

    if (ticketType === "Lab") {
      if (!labType) return false;
      if (labType === "checkoff") {
        const hasAnyTeammate =
          (teammate1 && teammate1Email) ||
          (teammate2 && teammate2Email) ||
          (teammate3 && teammate3Email);
        return Boolean(workstation && hasAnyTeammate);
      }
      if (labType === "question" && (!labNumber || !labPrompt)) return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid() || !classId) return;
    setSubmitting(true);
    setErrorMsg(null);

    // Map dialog fields -> backend payload
    let payload: {
      class_id: string;
      type: "OH" | "Lab";
      subtype?: string;
      details?: string;
      location?: string;
    } = {
      class_id: classId,
      type: ticketType as "OH" | "Lab",
    };

    if (ticketType === "OH") {
      if (ohType === "homework") {
        payload.subtype = "Homework";
        payload.details = `HW ${homeworkNumber} – Q${questionNumber}`;
      } else if (ohType === "general") {
        payload.subtype = "General";
        payload.details = generalQuestion;
      }
    }

    if (ticketType === "Lab") {
      if (labType === "checkoff") {
        payload.subtype = "Check-off";
        // include teammates/workstation in details for now
        const teammates = [
          teammate1 && teammate1Email ? `${teammate1} <${teammate1Email}>` : null,
          teammate2 && teammate2Email ? `${teammate2} <${teammate2Email}>` : null,
          teammate3 && teammate3Email ? `${teammate3} <${teammate3Email}>` : null,
        ].filter(Boolean) as string[];
        payload.details = `Workstation ${workstation}` + (teammates.length ? ` • Teammates: ${teammates.join(", ")}` : "");
        payload.location = workstation; // optional: also put in location
      }
      if (labType === "question") {
        payload.subtype = "Question";
        payload.details = `Lab ${labNumber} – ${labPrompt}`;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        credentials: "include",                 // ✅ send cookie session
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to create ticket (${res.status})`);
      }

      const ticket = await res.json();
      // call parent to refresh list / state
      onCreated?.(ticket);

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Ticket</DialogTitle>
          <DialogDescription>
            Choose the type of help you need and provide the required information.
          </DialogDescription>
        </DialogHeader>

        {!!errorMsg && (
          <div className="text-sm text-destructive -mt-2">{errorMsg}</div>
        )}

        <div className="space-y-6 py-4">
          {/* Ticket Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Ticket Type</Label>
            <RadioGroup
              value={ticketType}
              onValueChange={(value) => {
                setTicketType(value as "OH" | "Lab");
                setOhType("");
                setLabType("");
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="OH" id="oh" />
                <Label htmlFor="oh" className="flex items-center cursor-pointer">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  Office Hours
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Lab" id="lab" />
                <Label htmlFor="lab" className="flex items-center cursor-pointer">
                  <FlaskConical className="w-5 h-5 mr-2 text-secondary" />
                  Lab
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Office Hours Section */}
          {ticketType === "OH" && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Office Hours Type</Label>
                <RadioGroup value={ohType} onValueChange={(value) => setOhType(value as "homework" | "general")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="homework" id="homework" />
                    <Label htmlFor="homework">Homework Question</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general">General Question</Label>
                  </div>
                </RadioGroup>

                {ohType === "homework" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hw-number">Homework Number</Label>
                      <Input id="hw-number" placeholder="Ex: 4" value={homeworkNumber} onChange={(e) => setHomeworkNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="q-number">Question Number</Label>
                      <Input id="q-number" placeholder="Ex: 2.3" value={questionNumber} onChange={(e) => setQuestionNumber(e.target.value)} />
                    </div>
                  </div>
                )}

                {ohType === "general" && (
                  <div className="space-y-2">
                    <Label htmlFor="general-q">Describe your question</Label>
                    <Textarea
                      id="general-q"
                      placeholder="Briefly explain what you need help with..."
                      value={generalQuestion}
                      onChange={(e) => setGeneralQuestion(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Lab Section */}
          {ticketType === "Lab" && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Lab Help Type</Label>
                <RadioGroup value={labType} onValueChange={(value) => setLabType(value as "checkoff" | "question")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="checkoff" id="checkoff" />
                    <Label htmlFor="checkoff" className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Check-off
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="question" id="question" />
                    <Label htmlFor="question" className="flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Lab Question
                    </Label>
                  </div>
                </RadioGroup>

                {labType === "checkoff" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="workstation">Workstation Number</Label>
                      <Input
                        id="workstation"
                        placeholder="Ex: WS5"
                        value={workstation}
                        onChange={(e) => setWorkstation(e.target.value)}
                        onFocus={(e) => { if (e.target.placeholder === "Ex: WS5") e.target.placeholder = ""; }}
                        onBlur={(e) => { if (!e.target.value) e.target.placeholder = "Ex: WS5"; }}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Teammates (up to 3)</Label>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="teammate1">Teammate 1 Student ID</Label>
                          <Input id="teammate1" placeholder="Student ID" value={teammate1} onChange={(e) => setTeammate1(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teammate1-email">Teammate 1 Email</Label>
                          <Input id="teammate1-email" placeholder="Email address" type="email" value={teammate1Email} onChange={(e) => setTeammate1Email(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="teammate2">Teammate 2 Student ID</Label>
                          <Input id="teammate2" placeholder="Student ID (optional)" value={teammate2} onChange={(e) => setTeammate2(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teammate2-email">Teammate 2 Email</Label>
                          <Input id="teammate2-email" placeholder="Email address (optional)" type="email" value={teammate2Email} onChange={(e) => setTeammate2Email(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="teammate3">Teammate 3 Student ID</Label>
                          <Input id="teammate3" placeholder="Student ID (optional)" value={teammate3} onChange={(e) => setTeammate3(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teammate3-email">Teammate 3 Email</Label>
                          <Input id="teammate3-email" placeholder="Email address (optional)" type="email" value={teammate3Email} onChange={(e) => setTeammate3Email(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {labType === "question" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lab-number">Lab Number</Label>
                      <Input id="lab-number" placeholder="Ex: 3" value={labNumber} onChange={(e) => setLabNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lab-prompt">Question/Prompt</Label>
                      <Input
                        id="lab-prompt"
                        placeholder="Ex: 3.1"
                        value={labPrompt}
                        onChange={(e) => setLabPrompt(e.target.value)}
                        onFocus={(e) => { if (e.target.placeholder === "Ex: 3.1") e.target.placeholder = ""; }}
                        onBlur={(e) => { if (!e.target.value) e.target.placeholder = "Ex: 3.1"; }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => !submitting && onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? "Creating…" : "Create Ticket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketCreationDialog;
