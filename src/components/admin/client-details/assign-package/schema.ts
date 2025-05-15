
import * as z from "zod";

export const assignPackageSchema = z.object({
  packageId: z.string().min(1, { message: "יש לבחור חבילה" }),
  servingsCount: z.coerce.number().int().min(0, { message: "יש להזין מספר מנות תקין" }),
  paymentStatus: z.enum(["paid", "unpaid", "partial"]),
  notes: z.string().optional(),
  expirationDate: z.date().optional(),
});

export const paymentStatusOptions = [
  { value: "paid", label: "שולם" },
  { value: "unpaid", label: "טרם שולם" },
  { value: "partial", label: "חלקי" }
];
