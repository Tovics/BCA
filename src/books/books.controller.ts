import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Book } from './books.entity';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Get('query/:country')
  async getBooksByCountryAndYear(
    @Param('country') country: string,
    @Query('from') from?: number,
  ): Promise<Book[]> {
    return this.booksService.findBooksByAuthorCountryAndYear(country, from);
  }

  @Patch('update-all-with-year')
  async updateAllWithYear(): Promise<string> {
    await this.booksService.updateAllBooksWithYear();
    return 'All books updated with publication years';
  }
}
