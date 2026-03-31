import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QrCodeService } from './qrcode.service';
import {
  GenerateWebsiteDto,
  GenerateTextDto,
  GenerateVCardDto,
  GenerateWifiDto,
  GeneratePdfDto,
  GenerateAppStoreDto,
} from './dto/generate-qrcode.dto';
import { QrCodeFormat } from './entities/qrcode.entity';

@Controller('qrcode')
export class QrCodeController {
  constructor(private readonly qrService: QrCodeService) {}

  @Post('website')
  @HttpCode(HttpStatus.OK)
  async website(@Body() dto: GenerateWebsiteDto, @Res() res: Response) {
    return this.sendResponse(await this.qrService.generateWebsite(dto), res);
  }

  @Post('text')
  @HttpCode(HttpStatus.OK)
  async text(@Body() dto: GenerateTextDto, @Res() res: Response) {
    return this.sendResponse(await this.qrService.generateText(dto), res);
  }

  @Post('vcard')
  @HttpCode(HttpStatus.OK)
  async vcard(@Body() dto: GenerateVCardDto, @Res() res: Response) {
    return this.sendResponse(await this.qrService.generateVCard(dto), res);
  }

  @Post('wifi')
  @HttpCode(HttpStatus.OK)
  async wifi(@Body() dto: GenerateWifiDto, @Res() res: Response) {
    return this.sendResponse(await this.qrService.generateWifi(dto), res);
  }

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  async pdf(@Body() dto: GeneratePdfDto, @Res() res: Response) {
    return this.sendResponse(await this.qrService.generatePdf(dto), res);
  }

  @Post('appstore')
  @HttpCode(HttpStatus.OK)
  async appStore(@Body() dto: GenerateAppStoreDto, @Res() res: Response) {
    return this.sendResponse(await this.qrService.generateAppStore(dto), res);
  }

  @Get(':id/redirect')
  async redirectScan(@Param('id') id: string, @Res() res: Response) {
    const { url } = await this.qrService.redirect(id);
    return res.redirect(HttpStatus.FOUND, url);
  }

  @Get(':id/image')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const { format, data } = await this.qrService.getImage(id);
    return this.sendResponse({ id, format, data }, res);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.qrService.findOne(id);
  }

  @Post(':id/track')
  @HttpCode(HttpStatus.OK)
  async trackScan(@Param('id') id: string) {
    return this.qrService.trackScan(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQr(@Param('id') id: string) {
    return this.qrService.deleteQr(id);
  }

  private sendResponse(result: { id: string; format: QrCodeFormat; data: any }, res: Response) {
    const { id, format, data } = result;

    if (format === QrCodeFormat.PNG) {
      res.setHeader('X-QrCode-Id', id);
      res.setHeader('Content-Type', 'image/png');
      return res.send(data);
    }

    if (format === QrCodeFormat.SVG) {
      res.setHeader('X-QrCode-Id', id);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(data);
    }

    // BASE64
    return res.json({ id, data });
  }
}
