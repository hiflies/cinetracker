import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  async health() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', db: 'up' };
  }
}
