import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OpenLibraryClientService {
  constructor(private readonly httpService: HttpService) {}

  async getBookDetails(workId: string): Promise<any> {
    console.log(`getBookDetails called with workId: ${workId}`);
    
    try {
        const response = await lastValueFrom(this.httpService.get(`https://openlibrary.org/works/${workId}.json`));
        const data = response.data;
        return data;
    } catch (error) {
        throw error;
    }
  }
}