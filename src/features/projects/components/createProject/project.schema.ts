import { z } from "zod";
import { projectSchema } from "../../schemas";

export { projectSchema };
export type ProjectInput = z.infer<typeof projectSchema>;
