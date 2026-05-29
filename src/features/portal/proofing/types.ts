export interface Reply {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string | Date;
  resolved: boolean;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    role: string | null;
  };
}

export interface Annotation {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: string | Date;
  resolved: boolean;
  metadata: {
    x: number;
    y: number;
    page: number | null;
    resolved: boolean;
    pinNumber: number;
  } | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    role: string | null;
  };
  replies: Reply[];
}
