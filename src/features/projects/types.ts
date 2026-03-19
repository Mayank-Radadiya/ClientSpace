import { InferSelectModel } from "drizzle-orm";
import { projects, clients } from "@/db/schema";

export const projectColumns = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  status: projects.status,
  priority: projects.priority,
  startDate: projects.startDate,
  deadline: projects.deadline,
  budget: projects.budget,
  tags: projects.tags,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
  clientId: projects.clientId,
  clientCompanyName: clients.companyName,
  clientEmail: clients.email,
};
