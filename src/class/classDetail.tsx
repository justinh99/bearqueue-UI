export type ClassDetail = {
    id: string;
    school: string;
    department_code: string;
    class_number: string;
    class_name: string;
    semester: "Spring" | "Summer" | "Fall" | "Winter";
    year: number;
    instructor_name?: string | null;
    status: "active" | "closed";
    students_in_queue: number;
    average_wait_time?: string | null;
  };


  export type Stats = {
    class_id: string;
    students_in_queue: number;
    students_being_helped: number;
    average_help_time?: number | null; // minutes
    estimated_wait_time?: number | null;
  };