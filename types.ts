export enum Status {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done'
}

export interface WorkflowItemType {
  id: number;
  title: string;
  description: string;
  status: Status;
  imageUrl?: string;
  imageGender?: 'Male' | 'Female';
  isBookmarked?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Agent {
  name: string;
  gender: 'Male' | 'Female';
  role: string;
  skills: string[];
  personality: string;
  personality_prompt: string;
}