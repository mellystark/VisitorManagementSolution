export interface VisitorDto {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  qrCodeData: string;
  createdAt: string; // ISO tarih formatı
}
