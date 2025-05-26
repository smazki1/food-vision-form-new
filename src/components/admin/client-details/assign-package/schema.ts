import * as z from "zod";

export const assignPackageSchema = z.object({
  packageId: z.string().min(1, { message: "יש לבחור חבילה" }),
  total_servings_from_package: z.coerce.number().int().min(0, { message: "מספר המנות בחבילה חייב להיות חיובי" }).optional(),
  servings_used_at_assignment: z.coerce.number().int().min(0, { message: "מספר המנות שנוצלו חייב להיות חיובי" }).default(0),
  initial_remaining_servings: z.coerce.number().int().min(0, { message: "מספר המנות שנותרו חייב להיות חיובי" }),
  paymentStatus: z.enum(["paid", "unpaid", "partial"]),
  notes: z.string().optional(),
  expirationDate: z.date().optional(),
}).refine(data => {
  if (data.total_servings_from_package === undefined || data.servings_used_at_assignment === undefined) {
    return true;
  }
  return data.servings_used_at_assignment <= data.total_servings_from_package;
}, {
  message: "המנות שנוצלו לא יכולות לעלות על סך המנות בחבילה",
  path: ["servings_used_at_assignment"],
}).refine(data => {
  if (data.total_servings_from_package !== undefined && data.servings_used_at_assignment !== undefined) {
    return (data.total_servings_from_package - data.servings_used_at_assignment) === data.initial_remaining_servings;
  }
  return true;
}, {
  message: "אי-התאמה בין סך כל המנות, מנות שנוצלו, ומנות שנותרו",
  path: ["initial_remaining_servings"],
});

export const paymentStatusOptions = [
  { value: "paid", label: "שולם" },
  { value: "unpaid", label: "טרם שולם" },
  { value: "partial", label: "חלקי" }
];
