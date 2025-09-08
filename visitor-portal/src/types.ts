export interface Invitation {
  id: number
  name: string
  eventDate: string
  slug: string
  description?: string
  isActive: boolean
  createdByUserId?: string
  createdAt: string
}

export interface CreateInviteRequestDto {
  fullName: string
  email: string
  phoneNumber: string
  notes?: string
}
