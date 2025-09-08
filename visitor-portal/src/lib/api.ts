import axios from 'axios'
import type { Invitation, CreateInviteRequestDto } from '../types'

const baseURL = import.meta.env.VITE_API_BASE_URL as string
export const api = axios.create({ baseURL })

export async function getInvitationBySlug(slug: string): Promise<Invitation> {
  const { data } = await api.get(`/api/Invitations/${encodeURIComponent(slug)}`)
  return data
}

export async function createInviteRequest(
  slug: string,
  payload: CreateInviteRequestDto
) {
  const { data } = await api.post(
    `/api/Invitations/${encodeURIComponent(slug)}/request`,
    payload
  )
  return data as { message: string; requestId: number }
}
