export interface Student {
  number: number;
  name: string;
  status: string;
  personId: string;
}

export interface GroupData {
  number: number;
  countStudent: number;
  yearReceipt: number;
  course: number;
  direction: string;
  profile: string;
  institution: string;
  formTraining: string;
  students: Student[];
}