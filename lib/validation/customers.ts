import { z } from "zod";
export const customerIdSchema = z.string().uuid();
