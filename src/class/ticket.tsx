export type Ticket = {
    id: string;
    class_id: string;
    student_id: string;
    student_name: string;
    student_email?: string | null;
    type: "OH" | "Lab";
    subtype?: string | null;
    details?: string | null;
    location?: string | null;
    status: "waiting" | "being_helped" | "done" | "cancelled";
    created_at: string;
    updated_at: string;
    started_help_at?: string | null;
    finished_at?: string | null;
  };