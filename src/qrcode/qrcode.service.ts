import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import {
  QrCodeEntity,
  QrCodeType,
  QrCodeFormat,
  ErrorCorrectionLevel,
} from './entities/qrcode.entity';

const REDIRECTABLE_TYPES: QrCodeType[] = [
  QrCodeType.WEBSITE,
  QrCodeType.PDF,
  QrCodeType.APP_STORE,
];
import {
  GenerateWebsiteDto,
  GenerateTextDto,
  GenerateVCardDto,
  GenerateWifiDto,
  GeneratePdfDto,
  GenerateAppStoreDto,
} from './dto/generate-qrcode.dto';

@Injectable()
export class QrCodeService {
  constructor(
    @InjectRepository(QrCodeEntity)
    private readonly qrRepo: Repository<QrCodeEntity>,
  ) {}

  // ── Website ────────────────────────────────────────────────────────────────
  async generateWebsite(dto: GenerateWebsiteDto) {
    return this.generate(QrCodeType.WEBSITE, dto.url, dto);
  }

  // ── Text ───────────────────────────────────────────────────────────────────
  async generateText(dto: GenerateTextDto) {
    return this.generate(QrCodeType.TEXT, dto.text, dto);
  }

  // ── vCard ──────────────────────────────────────────────────────────────────
  async generateVCard(dto: GenerateVCardDto) {
    const vcard = this.buildVCard(dto);
    return this.generate(QrCodeType.VCARD, vcard, dto, dto);
  }

  // ── WiFi ───────────────────────────────────────────────────────────────────
  async generateWifi(dto: GenerateWifiDto) {
    const wifiString = `WIFI:T:${dto.encryption};S:${dto.ssid};P:${dto.password ?? ''};H:${dto.hidden ? 'true' : 'false'};;`;
    return this.generate(QrCodeType.WIFI, wifiString, dto, {
      ssid: dto.ssid,
      encryption: dto.encryption,
      hidden: dto.hidden,
    });
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  async generatePdf(dto: GeneratePdfDto) {
    const result = await this.generate(QrCodeType.PDF, dto.pdfUrl, dto, {
      pdfUrl: dto.pdfUrl,
    });
    // If URL points to a local upload, store the file path for later cleanup
    const localMatch = dto.pdfUrl.match(/\/uploads\/pdf\/([^/?#]+)$/);
    if (localMatch) {
      const localPath = path.join(
        process.env.UPLOAD_DIR ?? './uploads',
        'pdf',
        localMatch[1],
      );
      await this.qrRepo.update(result.id, { filePath: localPath });
    }
    return result;
  }

  // ── App Store ──────────────────────────────────────────────────────────────
  async generateAppStore(dto: GenerateAppStoreDto) {
    // Smart link: use iOS URL preferably (can be extended with redirect logic)
    const content = dto.iosUrl || dto.androidUrl;
    return this.generate(QrCodeType.APP_STORE, content, dto, {
      iosUrl: dto.iosUrl,
      androidUrl: dto.androidUrl,
    });
  }

  // ── Scan tracking ──────────────────────────────────────────────────────────
  async trackScan(id: string) {
    const entity = await this.qrRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Không tìm thấy mã QR');
    if (!entity.scanTracking) return entity;
    await this.qrRepo.increment({ id }, 'scanCount', 1);
    return await this.qrRepo.findOneBy({ id });
  }

  async redirect(id: string): Promise<{ url: string }> {
    const entity = await this.qrRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Không tìm thấy mã QR');
    if (!REDIRECTABLE_TYPES.includes(entity.type as QrCodeType)) {
      throw new BadRequestException(
        `Loại QR "${entity.type}" không hỗ trợ redirect`,
      );
    }
    if (entity.scanTracking) {
      await this.qrRepo.increment({ id }, 'scanCount', 1);
    }
    return { url: entity.content };
  }

  async findOne(id: string) {
    return this.qrRepo.findOneByOrFail({ id });
  }

  async getImage(id: string): Promise<{ format: QrCodeFormat; data: Buffer | string }> {
    const e = await this.qrRepo.findOneBy({ id });
    if (!e) throw new NotFoundException('Không tìm thấy mã QR');

    const qrContent = e.scanTracking && REDIRECTABLE_TYPES.includes(e.type as QrCodeType)
      ? `${(process.env.APP_URL ?? '').replace(/\/$/, '')}/qrcode/${e.id}/redirect`
      : e.content;

    const opts: QRCode.QRCodeToBufferOptions = {
      errorCorrectionLevel: e.logoUrl ? ErrorCorrectionLevel.H : e.errorCorrection as any,
      width: e.size,
      color: { dark: e.fgColor, light: e.bgColor },
    };

    let data: Buffer | string;
    try {
      if (e.format === QrCodeFormat.SVG) {
        data = await QRCode.toString(qrContent, { ...opts, type: 'svg' } as QRCode.QRCodeToStringOptions);
      } else {
        let buf = await QRCode.toBuffer(qrContent, opts);
        if (e.logoUrl) buf = await this.composeLogo(buf, e.logoUrl, e.size);
        data = e.format === QrCodeFormat.BASE64
          ? `data:image/png;base64,${buf.toString('base64')}`
          : buf;
      }
    } catch (err) {
      throw new BadRequestException(`Không thể tạo ảnh: ${err.message}`);
    }

    return { format: e.format as QrCodeFormat, data };
  }

  async deleteQr(id: string) {
    const entity = await this.qrRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Không tìm thấy mã QR');

    // Delete local uploaded file if exists
    if (entity.filePath) {
      const absPath = path.resolve(entity.filePath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    }

    await this.qrRepo.delete(id);
  }

  // ── Core generator ─────────────────────────────────────────────────────────
  private async generate(
    type: QrCodeType,
    content: string,
    dto: any,
    metadata?: Record<string, any>,
  ) {
    const format: QrCodeFormat = dto.format ?? QrCodeFormat.PNG;
    const size: number = dto.size ?? 300;
    // Khi có logo, bắt buộc dùng Error Correction H để QR vẫn đọc được dù bị che
    const errorCorrection: ErrorCorrectionLevel =
      dto.logoUrl ? ErrorCorrectionLevel.H : (dto.errorCorrection ?? ErrorCorrectionLevel.M);
    const scanTracking: boolean = dto.scanTracking ?? false;

    // Save entity first to get the ID (needed for redirect URL)
    const entity = this.qrRepo.create({
      type,
      content,
      metadata: metadata ?? null,
      format,
      errorCorrection,
      size,
      fgColor: dto.fgColor ?? '#000000',
      bgColor: dto.bgColor ?? '#ffffff',
      logoUrl: dto.logoUrl ?? null,
      frameStyle: dto.frameStyle ?? null,
      dotStyle: dto.dotStyle ?? 'square',
      scanTracking,
    });
    const saved = await this.qrRepo.save(entity);

    // For URL-based types with scan tracking, encode redirect URL into QR
    const qrContent =
      scanTracking && REDIRECTABLE_TYPES.includes(type)
        ? `${(process.env.APP_URL ?? '').replace(/\/$/, '')}/qrcode/${saved.id}/redirect`
        : content;

    const qrOptions: QRCode.QRCodeToBufferOptions = {
      errorCorrectionLevel: errorCorrection,
      width: size,
      color: {
        dark: dto.fgColor ?? '#000000',
        light: dto.bgColor ?? '#ffffff',
      },
    };

    let output: string | Buffer;

    try {
      if (format === QrCodeFormat.SVG) {
        output = await QRCode.toString(qrContent, { ...qrOptions, type: 'svg' } as QRCode.QRCodeToStringOptions);
      } else if (format === QrCodeFormat.BASE64) {
        let buf = await QRCode.toBuffer(qrContent, qrOptions);
        if (dto.logoUrl) buf = await this.composeLogo(buf, dto.logoUrl, size);
        output = `data:image/png;base64,${buf.toString('base64')}`;
      } else {
        let buf = await QRCode.toBuffer(qrContent, qrOptions);
        if (dto.logoUrl) buf = await this.composeLogo(buf, dto.logoUrl, size);
        output = buf;
      }
    } catch (err) {
      await this.qrRepo.delete(saved.id);
      if (err.message?.toLowerCase().includes('too big') || err.message?.toLowerCase().includes('amount of data')) {
        throw new BadRequestException('Nội dung quá dài, không thể tạo mã QR. Vui lòng rút ngắn lại.');
      }
      throw new BadRequestException(`Không thể tạo mã QR: ${err.message}`);
    }

    return { id: saved.id, format, data: output };
  }

  // ── Logo composite ─────────────────────────────────────────────────────────
  private async composeLogo(qrBuffer: Buffer, logoUrl: string, qrSize: number): Promise<Buffer> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp');
      const logoSize = Math.round(qrSize * 0.22);

      const res = await fetch(logoUrl);
      if (!res.ok) return qrBuffer;
      const logoBuffer = Buffer.from(await res.arrayBuffer());

      const padding = Math.round(logoSize * 0.15);
      const innerSize = logoSize - padding * 2;

      const logo = await sharp(logoBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .extend({
          top: padding, bottom: padding, left: padding, right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();

      return sharp(qrBuffer)
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toBuffer();
    } catch {
      return qrBuffer; // nếu lỗi thì trả QR không có logo
    }
  }

  // ── vCard builder ──────────────────────────────────────────────────────────
  private buildVCard(dto: GenerateVCardDto): string {
    const lines: string[] = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${dto.lastName ?? ''};${dto.firstName};;;`,
      `FN:${dto.firstName} ${dto.lastName ?? ''}`.trim(),
    ];
    if (dto.organization) lines.push(`ORG:${dto.organization}`);
    if (dto.title) lines.push(`TITLE:${dto.title}`);
    if (dto.email) lines.push(`EMAIL:${dto.email}`);
    if (dto.phone) lines.push(`TEL:${dto.phone}`);
    if (dto.website) lines.push(`URL:${dto.website}`);
    if (dto.address || dto.city || dto.country)
      lines.push(`ADR:;;${dto.address ?? ''};${dto.city ?? ''};;${dto.country ?? ''}`);
    if (dto.note) lines.push(`NOTE:${dto.note}`);
    lines.push('END:VCARD');
    return lines.join('\n');
  }
}
