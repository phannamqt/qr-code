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
  WifiEncryption,
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
    return this.qrRepo.findOneBy({ id });
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
    const errorCorrection: ErrorCorrectionLevel = dto.errorCorrection ?? ErrorCorrectionLevel.M;
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
        ? `${process.env.APP_URL ?? ''}/qrcode/${saved.id}/redirect`
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

    if (format === QrCodeFormat.SVG) {
      output = await QRCode.toString(qrContent, { ...qrOptions, type: 'svg' } as QRCode.QRCodeToStringOptions);
    } else if (format === QrCodeFormat.BASE64) {
      output = await QRCode.toDataURL(qrContent, qrOptions as unknown as QRCode.QRCodeToDataURLOptions);
    } else {
      output = await QRCode.toBuffer(qrContent, qrOptions);
    }

    return { id: saved.id, format, data: output };
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
