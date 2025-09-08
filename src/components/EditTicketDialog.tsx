import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { BookOpen, FlaskConical, Users, HelpCircle } from "lucide-react";

interface Ticket {
  id: number;
  student: string;
  type: "Lab" | "OH";
  subtype: string;
  details: string;
  position: number;
  waitTime: string;
  status: string;
}

interface EditTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onSave: (updatedTicket: Ticket) => void;
}

const EditTicketDialog = ({ open, onOpenChange, ticket, onSave }: EditTicketDialogProps) => {
  const [ticketType, setTicketType] = useState<"OH" | "Lab" | "">("");
  const [ohType, setOhType] = useState<"homework" | "general" | "">("");
  const [labType, setLabType] = useState<"checkoff" | "question" | "">("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (ticket) {
      setTicketType(ticket.type);
      setDetails(ticket.details);
      
      if (ticket.type === "OH") {
        setOhType(ticket.subtype.toLowerCase() as "homework" | "general");
      } else if (ticket.type === "Lab") {
        setLabType(ticket.subtype.toLowerCase().replace("-", "") as "checkoff" | "question");
      }
    }
  }, [ticket]);

  const handleSave = () => {
    if (!ticket) return;
    
    const updatedTicket: Ticket = {
      ...ticket,
      type: ticketType as "Lab" | "OH",
      subtype: ticketType === "OH" ? 
        (ohType === "homework" ? "Homework" : "General") :
        (labType === "checkoff" ? "Check-off" : "Question"),
      details: details
    };
    
    onSave(updatedTicket);
    onOpenChange(false);
  };

  const isFormValid = () => {
    if (!ticketType || !details) return false;
    
    if (ticketType === "OH" && !ohType) return false;
    if (ticketType === "Lab" && !labType) return false;
    
    return true;
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Ticket</DialogTitle>
          <DialogDescription>
            Modify your ticket information. You can only edit your own tickets.
          </DialogDescription>
        </DialogHeader>

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
                <RadioGroupItem value="OH" id="oh-edit" />
                <Label htmlFor="oh-edit" className="flex items-center cursor-pointer">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  Office Hours
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="Lab" id="lab-edit" />
                <Label htmlFor="lab-edit" className="flex items-center cursor-pointer">
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
                    <RadioGroupItem value="homework" id="homework-edit" />
                    <Label htmlFor="homework-edit">Homework Question</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general-edit" />
                    <Label htmlFor="general-edit">General Question</Label>
                  </div>
                </RadioGroup>
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
                    <RadioGroupItem value="checkoff" id="checkoff-edit" />
                    <Label htmlFor="checkoff-edit" className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Check-off
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="question" id="question-edit" />
                    <Label htmlFor="question-edit" className="flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Lab Question
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details-edit">Details</Label>
            <Textarea
              id="details-edit"
              placeholder="Describe your question or request..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isFormValid()}
            className="bg-primary hover:bg-primary/90"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTicketDialog;