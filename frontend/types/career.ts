export type JobStatus = "saved" | "applied" | "interviewing" | "offer" | "closed" | "rejected";

export type StatusHistoryEntry = {
  status: JobStatus;
  changedAt: string;
};

export type JobSearchResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  snippet: string;
  source: string;
  postedDate: string;
  dead?: boolean;
  score?: number;
};

export type JobAnalysis = {
  overlap: string[];
  gaps: string[];
  positioning: string;
  completedAt: string;
};

export type JobResearchBrief = {
  entryId: string;
  entryTitle: string;
  alignmentReason: string;
  the_story: string;
  what_made_it_different: string;
  daily_reality: string;
  surprising_details: string | null;
  research_quality: "high" | "medium" | "low";
};

export type JobRefinement = {
  entryId: string;
  entryTitle: string;
  entryOrganization: string;
  entryLocation?: string;
  entryType: string;
  entryStartDate?: string;
  entryEndDate?: string;
  originalBullets: string[];
  refinedBullets: string[];
  standoutNote: string;
  accepted: boolean;
  dismissed: boolean;
  refinedAt: string;
};

export type Job = {
  id: string;
  company: string;
  role: string;
  url?: string;
  urlVerified?: boolean;
  jd?: string;
  overlaps?: string;
  notes?: string;
  status: JobStatus;
  rejectedFrom?: JobStatus;
  statusHistory?: StatusHistoryEntry[];
  addedAt: string;
  updatedAt: string;
  analysis?: JobAnalysis;
  research?: JobResearchBrief[];
  refinements?: JobRefinement[];
  coverLetter?: string;
  app_questions?: [string, string][];
  applicationReview?: {
    status: "pending" | "approved" | "rejected";
    decidedAt?: string;
  };
};

export type ContactStatus =
  | "not_contacted"
  | "connection_requested"
  | "connected"
  | "messaged"
  | "replied"
  | "meeting_scheduled"
  | "followed_up";

export type ContactSource = "google_contacts";

export type Interaction = {
  id: string;
  date: string;
  notes?: string;
};

// Identity fields (name/role/company/email/phone/photoUrl) always come from
// the user's Google Contacts — this app never stores or edits them. Only the
// CRM fields below (status/notes/interactions/preferredContact/
// followUpCadence) are OpenPip's own, kept as wrapper data in Drive app data.
export type Contact = {
  id: string;
  name: string;
  role: string;
  company: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  preferredContact?: "email" | "linkedin" | "text";
  source: ContactSource;
  status: ContactStatus;
  notes?: string;
  lastInteractionDate?: string;
  interactions?: Interaction[];
  followUpCadence?: string;
  addedAt?: string;
  updatedAt?: string;
};

export type TimelineEntryType = "work" | "education" | "certification" | "award" | "club" | "project";

export type CourseEntry = {
  term: string;
  code: string;
  name: string;
  grade: string;
  credits: number;
};

export type EnrollmentPeriod = {
  startDate: string;
  endDate: string;
  status: string;
  gpa?: string;
};

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  title: string;         // job title / degree / cert name / project name
  organization: string; // employer / institution / issuer
  location?: string;    // "City, ST" or "City, Country" if available
  startDate?: string;   // "Mon YYYY", "YYYY", or ""
  endDate?: string;     // "Mon YYYY", "YYYY", "Present", or ""
  dateSort?: string;    // computed "YYYY-MM" for sorting (e.g. "2024-09")
  description?: string;
  skills?: string[];
  courses?: CourseEntry[];            // education: structured course list
  enrollmentHistory?: EnrollmentPeriod[]; // education: drop/re-enroll history
};
