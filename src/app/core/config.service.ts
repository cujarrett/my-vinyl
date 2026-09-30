import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'

export interface PublicConfig {
  apiUrl: string
}

// Fetched once before bootstrap.
// Prod: the platform serves /config.json from the Spa's publicConfig.
// Dev: ng serve serves public/config.json.
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient)
  private config?: PublicConfig

  async load(): Promise<void> {
    this.config = await firstValueFrom(this.http.get<PublicConfig>('/config.json'))
  }

  get apiUrl(): string {
    if (!this.config) throw new Error('ConfigService.load() has not run')
    return this.config.apiUrl
  }
}
