import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DecodeService } from './decode.service';

const ALLOWED_MIMETYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];

@Controller('decode')
export class DecodeController {
  constructor(private readonly decodeService: DecodeService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Định dạng file không được hỗ trợ: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async decode(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file nào được tải lên');
    }
    return this.decodeService.decodeImage(file);
  }
}
