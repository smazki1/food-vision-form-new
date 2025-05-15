
export interface Package {
  id: string;
  name: string;
  servingsCount: number;
  price: number;
  description?: string;
}

// Temporary mock packages until Module 2 is implemented
export const MOCK_PACKAGES: Package[] = [
  {
    id: "basic",
    name: "חבילה בסיסית",
    servingsCount: 5,
    price: 500,
    description: "חבילה בסיסית עם 5 מנות"
  },
  {
    id: "standard",
    name: "חבילה סטנדרטית",
    servingsCount: 15,
    price: 1200,
    description: "חבילה סטנדרטית עם 15 מנות"
  },
  {
    id: "premium",
    name: "חבילה פרימיום",
    servingsCount: 30,
    price: 2000,
    description: "חבילה פרימיום עם 30 מנות"
  }
];
