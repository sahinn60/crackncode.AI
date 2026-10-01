import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Auth } from '../../common/decorators/auth.decorator';
import { UploadService } from './upload.service';

@Auth('admin')
@Controller('admin/upload')
export class UploadController {
  constructor(private readonly svc: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.svc.uploadImage(file);
    return { url };
  }
}
