import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum QrCodeType {
  WEBSITE = 'website',
  VCARD = 'vcard',
  TEXT = 'text',
  WIFI = 'wifi',
  PDF = 'pdf',
  APP_STORE = 'app_store',
}

export enum QrCodeFormat {
  PNG = 'png',
  SVG = 'svg',
  BASE64 = 'base64',
}

export enum ErrorCorrectionLevel {
  L = 'L',
  M = 'M',
  Q = 'Q',
  H = 'H',
}

@Entity('qr_codes')
export class QrCodeEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  type: QrCodeType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 10, default: QrCodeFormat.PNG })
  format: QrCodeFormat;

  @Column({ name: 'error_correction', type: 'varchar', length: 2, default: ErrorCorrectionLevel.M })
  errorCorrection: ErrorCorrectionLevel;

  @Column({ type: 'int', default: 300 })
  size: number;

  @Column({ name: 'fg_color', type: 'varchar', length: 20, default: '#000000' })
  fgColor: string;

  @Column({ name: 'bg_color', type: 'varchar', length: 20, default: '#ffffff' })
  bgColor: string;

  @Column({ name: 'logo_url', type: 'varchar', nullable: true })
  logoUrl: string;

  @Column({ name: 'frame_style', type: 'varchar', length: 50, nullable: true })
  frameStyle: string;

  @Column({ name: 'dot_style', type: 'varchar', length: 50, default: 'square' })
  dotStyle: string;

  @Column({ name: 'file_path', type: 'varchar', nullable: true })
  filePath: string;

  @Column({ name: 'scan_count', type: 'int', default: 0 })
  scanCount: number;

  @Column({ name: 'scan_tracking', type: 'boolean', default: false })
  scanTracking: boolean;
}
