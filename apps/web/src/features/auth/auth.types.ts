export type Company = {
  id: number
  name: string
}

export type UserProfile = {
  name: string
  email: string
  memberships?: Array<{
    company: Company
  }>
}