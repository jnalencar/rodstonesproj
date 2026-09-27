export type BundleInventoryItem = {
  id: number
  bundleCode: string
  status: string
  block: string | null
  location: string | null
  thickness: number | string | null
  weight: number | string | null
  basePrice: number | string | null
  availableSlabCount: number
  _count: {
    slabs: number
  }
  material: { name: string }
  materialType: { name: string }
  materialClassification: { name: string }
  quality: { name: string }
  finish: { name: string }
  images: Array<{
    id: number
    url: string
    isPrimary: boolean
  }>
}

export type BundleSlab = {
  id: number
  number: number
  status: string
  length: number | string | null
  height: number | string | null
  area: number | string | null
  images: Array<{
    id: number
    url: string
    originalName: string
  }>
}

export type BundleDetails = Omit<BundleInventoryItem, 'availableSlabCount' | '_count'> & {
  slabs: BundleSlab[]
}