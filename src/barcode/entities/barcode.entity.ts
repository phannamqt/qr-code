import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum BarcodeType {
  CODE128 = 'code128',
  CODE39 = 'code39',
  EAN13 = 'ean13',
  EAN8 = 'ean8',
  UPCA = 'upca',
  UPCE = 'upce',
  ITF = 'itf14',
  CODABAR = 'codabar',
  MSI = 'msi',
  PHARMACODE = 'pharmacode',
}

export enum BarcodeFormat {
  PNG = 'png',
  SVG = 'svg',
}

@Entity('barcodes')
export class BarcodeEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  type: BarcodeType;

  @Column({ type: 'varchar', length: 500 })
  content: string;

  @Column({ type: 'varchar', length: 10, default: BarcodeFormat.PNG })
  format: BarcodeFormat;

  @Column({ type: 'int', default: 200 })
  width: number;

  @Column({ type: 'int', default: 80 })
  height: number;

  @Column({ name: 'fg_color', type: 'varchar', length: 20, default: '#000000' })
  fgColor: string;

  @Column({ name: 'bg_color', type: 'varchar', length: 20, default: '#ffffff' })
  bgColor: string;

  @Column({ name: 'show_text', type: 'boolean', default: true })
  showText: boolean;

  @Column({ name: 'file_path', type: 'varchar', nullable: true })
  filePath: string;
}
