import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { OpenLibraryClientService } from '../open-library/open-library-client.service';
import { Book } from './books.entity';
import { Readable } from 'stream';

@Injectable()
export class BooksService {
  readonly DEFAULT_RELATIONS = ['authors'];

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly openLibraryClientService: OpenLibraryClientService,
  ) {}

  findAll(): Promise<Book[]> {
    return this.bookRepository.find({ relations: this.DEFAULT_RELATIONS });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({
      relations: this.DEFAULT_RELATIONS,
      where: { id },
    });

    if (!book) throw new NotFoundException(`Book with id ${id} not found.`);

    return book;
  }

  async updateAllBooksWithYear(): Promise<void> {
    const books = await this.findAll();
    const bookStream = Readable.from(books);

    bookStream.on('data', async (book: Book) => {
      try {
        const bookDetails = await this.getBookDetailsWithFallback(book.workId);
        if (bookDetails?.first_publish_date) {
          await this.updateBookYear(book, bookDetails.first_publish_date);
        } else {
          console.log(`No publish date found for book ID: ${book.id}`);
        }
      } catch (error) {
        console.error(`Failed to update book (ID: ${book.id}): ${error.message}`);
      }
    });

    return new Promise((resolve, reject) => {
      bookStream.on('end', resolve);
      bookStream.on('error', reject);
    });
  }

  private async getBookDetailsWithFallback(workId: string): Promise<any> {
    let data = await this.openLibraryClientService.getBookDetails(workId);

    if (!data.first_publish_date) {
      const location = this.extractLocation(data.location);
      if (location) {
        console.log(`Extracted location: ${location}`);
        data = await this.openLibraryClientService.getBookDetails(location);
      } else {
        throw new Error('Failed to extract location from data.');
      }
    }
    return data;
  }

  private async updateBookYear(book: any, firstPublishDate: string): Promise<void> {
    const year = this.extractYear(firstPublishDate);
    if (year) {
      book.year = year;
      await this.bookRepository.save(book);
    }
  }

  private extractYear(dateString: string): number | null {
    const match = dateString.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  }

  private extractLocation(input: string): string | null {
    const match = input.match(/[^/]+$/);
    return match ? match[0] : null;
  }
}
