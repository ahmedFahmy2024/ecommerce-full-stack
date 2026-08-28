export interface UserInClassRole {
  id: string;
  name: { ar: string; en: string };
  guardName: string;
}

export interface UserInClassParent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
}

export interface UserInClassQuizStats {
  totalExams: number;
  takenExams: number;
  notTakenExams: number;
  passedExams: number;
  failedExams: number;
}

export interface UserInClassQuizStatistics {
  quiz: UserInClassQuizStats;
  other: UserInClassQuizStats;
  totalQuizzes: number;
  takenQuizzes: number;
  notTakenQuizzes: number;
  passedQuizzes: number;
  failedQuizzes: number;
}

export interface UserInClass {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: "male" | "female";
  birthDate: string;
  status: "active" | "not_active" | "deleted" | "pending";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: UserInClassParent;
  roles: UserInClassRole[];
  userClassId: string;
  userClassStatus: string;
  userClassType: string;
  quizStatistics: UserInClassQuizStatistics;
}
