import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

import { ConfigService } from './config.service'
import { CollectionPage } from './vinyl.model'

const PER_PAGE = 50

@Injectable({ providedIn: 'root' })
export class VinylService {
  private readonly http = inject(HttpClient)
  private readonly config = inject(ConfigService)

  getCollection(username?: string, page = 1, perPage = PER_PAGE): Observable<CollectionPage> {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (username) params.set('username', username)
    return this.http.get<CollectionPage>(`${this.config.apiUrl}?${params}`)
  }
}
