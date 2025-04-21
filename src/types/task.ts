
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: Date;
  listId: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
}
