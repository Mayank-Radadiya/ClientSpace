export type FilesViewMode = "list" | "grid";

export type FileKind =
  | "pdf"
  | "image"
  | "doc"
  | "archive"
  | "video"
  | "audio"
  | "zip"
  | "rar"
  | "ppt"
  | "pptx"
  | "xls"
  | "xlsx"
  | "csv"
  
  | "other";

export type ProjectFile = {
  id: string;
  name: string;
  mimeType: string;
  fileKind: FileKind;
  approvalStatus: "pending_review" | "approved" | "changes_requested";
  versionNumber: number | null;
  sizeBytes: number | null;
  updatedAt: Date;
  storagePath: string | null;
};

export type ProjectFolder = {
  id: string;
  name: string;
  createdAt: Date;
};

export type RecentUpload = {
  id: string;
  assetId: string;
  fileName: string;
  fileKind: FileKind;
  sizeBytes: number;
  createdAt: Date;
  uploaderName: string | null;
};

export type ProjectFilesPageData = {
  project: {
    id: string;
    name: string;
    clientName: string | null;
  };
  files: ProjectFile[];
  folders: ProjectFolder[];
  recentUploads: RecentUpload[];
};
