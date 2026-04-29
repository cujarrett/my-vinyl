import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'

import { VinylService } from './vinyl.service'
import { CollectionPage } from './vinyl.model'

const mockPage: CollectionPage = {
  releases: [
    {
      id: 1,
      artist: 'The Beatles',
      title: 'Abbey Road',
      year: 1969,
      label: 'Apple',
      cover_url: 'https://example.com/abbey.jpg',
    },
  ],
  page: 1,
  pages: 2,
  items: 75,
}

describe('VinylService', () => {
  let service: VinylService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(VinylService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('fetches page 1 with default params when no username given', () => {
    service.getCollection().subscribe()
    const req = http.expectOne((r) => r.url.includes('/collection'))
    expect(req.request.urlWithParams).toContain('page=1')
    expect(req.request.urlWithParams).toContain('per_page=50')
    expect(req.request.urlWithParams).not.toContain('username')
    req.flush(mockPage)
  })

  it('includes username param when provided', () => {
    service.getCollection('tom').subscribe()
    const req = http.expectOne((r) => r.url.includes('/collection'))
    expect(req.request.urlWithParams).toContain('username=tom')
    req.flush(mockPage)
  })

  it('includes page and per_page params', () => {
    service.getCollection('tom', 3, 25).subscribe()
    const req = http.expectOne((r) => r.url.includes('/collection'))
    expect(req.request.urlWithParams).toContain('page=3')
    expect(req.request.urlWithParams).toContain('per_page=25')
    req.flush(mockPage)
  })

  it('returns the response as CollectionPage', (done) => {
    service.getCollection('tom').subscribe((page) => {
      expect(page.releases).toHaveLength(1)
      expect(page.pages).toBe(2)
      expect(page.items).toBe(75)
      done()
    })
    http.expectOne((r) => r.url.includes('/collection')).flush(mockPage)
  })
})
