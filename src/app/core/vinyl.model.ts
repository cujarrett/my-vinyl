export interface CollectionItem {
  id: number
  artist: string
  title: string
  year: number
  label: string
  cover_url: string
  date_added: string
}

export interface CollectionPage {
  releases: CollectionItem[]
  page: number
  pages: number
  items: number // total count
}
