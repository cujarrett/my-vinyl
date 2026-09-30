import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'

import { ConfigService } from './config.service'

describe('ConfigService', () => {
  let service: ConfigService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(ConfigService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('throws before load', () => {
    expect(() => service.apiUrl).toThrow()
  })

  it('exposes apiUrl after loading /config.json', async () => {
    const loading = service.load()
    http.expectOne('/config.json').flush({ apiUrl: '/api/collection' })
    await loading
    expect(service.apiUrl).toBe('/api/collection')
  })
})
