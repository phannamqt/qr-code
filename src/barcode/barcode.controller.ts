import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BarcodeService } from './barcode.service';
import { GenerateBarcodeDto } from './dto/generate-barcode.dto';
import { BarcodeFormat } from './entities/barcode.entity';

@Controller('barcode')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Body() dto: GenerateBarcodeDto, @Res() res: Response) {
    const result = await this.barcodeService.generate(dto);
    const { id, format, data } = result;

    if (format === BarcodeFormat.SVG) {
      res.setHeader('X-Barcode-Id', id);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(data);
    }

    res.setHeader('X-Barcode-Id', id);
    res.setHeader('Content-Type', 'image/png');
    return res.send(data);
  }

  @Get('formats')
  getSupportedTypes() {
    return this.barcodeService.getSupportedTypes();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.barcodeService.findOne(id);
  }
}
