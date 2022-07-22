import { Controller, Get } from '@nestjs/common';
import { AppService } from '../service/app.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'health check' })
  getHello(): string {
    return this.appService.getHello();
  }
}
