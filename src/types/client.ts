export interface ClientLesson {
  id: number;
  subject: string | null;
  teacher: string | null;
  room: string | null;
  time: string | null;
  day_week: string | null;
  groupId: number | null;
  color: string | null;
}