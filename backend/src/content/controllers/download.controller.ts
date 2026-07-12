import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DownloadService } from '../services/download.service';

@Controller('content')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('full-session-by-token/:token')
  async getSessionByToken(@Param('token') token: string) {
    return this.downloadService.getSessionByToken(token);
  }

  @Get('download-session/:token')
  async downloadSession(@Param('token') token: string, @Res() res: Response) {
    await this.downloadService.streamZip(token, res);
  }
}
