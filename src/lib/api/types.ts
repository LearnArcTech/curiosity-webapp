/**
 * $lib/api/types.ts
 */

export type Role = "teacher" | "student";

export interface OnboardingStatus {
  role: Role | null;
  username: string | null;
  complete: boolean;
}

export interface DeviceRow {
  id: string;
  device_name: string;
  created_at: string;
  last_seen: string;
  is_current: boolean;
}

export interface CourseRow {
  id: string;
  name: string;
  repo_used: number;
  quota_total: number;
  created_at: string;
}

export interface TeacherRow {
  id: string;
  username: string;
  email: string;
  added_at: string;
}

export interface StudentRow {
  id: string;
  username: string;
  email: string;
  enrolled_at: string;
  quiz_score: number;
  participation_value: number;
  participation_is_manual: boolean;
}

export interface FileRow {
  id: string;
  filename: string;
  file_size: number;
  file_type: string | null;
  uploaded_at: string;
  uploaded_by: string;
  storage_path: string;
  ocr_processed?: boolean;
}

export interface RepositorySummary {
  files: FileRow[];
  quota_used: number;
  quota_total: number;
  quota_remaining: number;
}

export interface SessionRow {
  id: string;
  course_id: string;
  name: string;
  require_waiting_room: boolean;
  created_by: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  duration_minutes: number;
  participant_count: number;
}

export interface SessionParticipant {
  id: string;
  username: string;
  status: "waiting" | "approved" | "left";
  is_teacher: boolean;
  joined_at: string;
  left_at: string | null;
  hand_raised: boolean;
}

export interface SessionDetail extends SessionRow {
  waiting_count: number;
  participants: SessionParticipant[];
}

export interface PodiumEntry {
  username: string;
  quiz_score: number;
}

export interface DashboardStudentEntry {
  id: string;
  username: string;
  course_id: string;
  participation_value: number;
  quiz_score: number;
}

export interface DashboardData {
  participation_average: number | null;
  assistance_average: number | null;
  session_length_average: number | null;
  podium: PodiumEntry[];
  students: DashboardStudentEntry[];
}

export interface CourseSummaryStudentEntry {
  id: string;
  username: string;
  participation_value: number;
  quiz_score: number;
}

export interface CourseSummaryData {
  participation_average: number | null;
  assistance_average: number | null;
  session_length_average: number | null;
  podium: PodiumEntry[];
  students: CourseSummaryStudentEntry[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface SessionQuiz {
  id: string;
  session_id: string;
  course_id: string;
  title: string;
  description: string | null;
  question_type: "single" | "multiple" | "input";
  options: QuizOption[];
  time_limit_seconds: number | null;
  ends_at: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface QuizResponseRow {
  id: string;
  quiz_id: string;
  student_id: string;
  answer: string | string[] | null;
  is_correct: boolean;
  answered_at: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: Role | null;
  avatar_path: string | null;
  created_at: string;
}

export type FontSize = "small" | "medium" | "large";
export type Contrast = "normal" | "high" | "max";

export interface UserPreferences {
  user_id: string;
  font_size: FontSize;
  contrast: Contrast;
  simple_mode: boolean;
  updated_at: string;
}
