export const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '')

type ApiErrorBody = {
  message?: string | string[]
}

async function getErrorMessage(response: Response) {
  const body = await response.json().catch(() => null) as ApiErrorBody | null

  if (Array.isArray(body?.message)) return body.message.join(', ')
  if (body?.message) return body.message
  return 'Não foi possível concluir a solicitação.'
}

export async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json() as Promise<T>
}