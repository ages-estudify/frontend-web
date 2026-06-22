export interface Trail {
  id: string;
  name: string;
  text: string;
  iconUrl: string;
  order: number;
  subjectId: string;
}

export interface TrailPayload {
  name: string;
  text: string;
  iconUrl: string;
  order: number;
  subjectId: string;
}

export interface TrailFormData {
  name: string;
  text: string;
  iconUrl: string;
  order: string;
  subjectId: string;
}

export interface TrailSubjectOption {
  id: string;
  name: string;
}

export interface TrailQuestion {
  id: string;
  title: string;
  discipline?: string;
  content?: string;
  year?: number;
  enable?: boolean;
}
