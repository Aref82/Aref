export interface User {
  id: string;
  email: string;
  fullName: string;
  fiscalId?: string;       
  phoneNumber?: string;
  address?: string;
  certificatePath?: string; // مسیر گواهی دیجیتال
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}