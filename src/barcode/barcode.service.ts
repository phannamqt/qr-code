import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bwipjs from 'bwip-js';
import { BarcodeEntity, BarcodeFormat } from './entities/barcode.entity';
import { GenerateBarcodeDto } from './dto/generate-barcode.dto';

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(BarcodeEntity)
    private readonly barcodeRepo: Repository<BarcodeEntity>,
  ) {}

  async generate(dto: GenerateBarcodeDto): Promise<{ id: string; format: BarcodeFormat; data: Buffer | string }> {
    const format = dto.format ?? BarcodeFormat.PNG;

    const bwipOptions: bwipjs.RenderOptions = {
      bcid: dto.type as string,
      text: dto.content,
      scale: 3,
      height: Math.round((dto.height ?? 80) / 10),
      width: Math.round((dto.width ?? 200) / 10),
      includetext: dto.showText ?? true,
      textxalign: 'center' as const,
      backgroundcolor: (dto.bgColor ?? '#ffffff').replace('#', ''),
      barcolor: (dto.fgColor ?? '#000000').replace('#', ''),
    };

    let data: Buffer | string;

    try {
      if (format === BarcodeFormat.SVG) {
        data = bwipjs.toSVG(bwipOptions);
      } else {
        data = Buffer.from(await bwipjs.toBuffer(bwipOptions));
      }
    } catch (err) {
      throw new BadRequestException(`Không thể tạo barcode: ${err.message}`);
    }

    const entity = this.barcodeRepo.create({
      type: dto.type,
      content: dto.content,
      format,
      width: dto.width ?? 200,
      height: dto.height ?? 80,
      fgColor: dto.fgColor ?? '#000000',
      bgColor: dto.bgColor ?? '#ffffff',
      showText: dto.showText ?? true,
    });
    const saved = await this.barcodeRepo.save(entity);

    return { id: saved.id, format, data };
  }

  async findOne(id: string) {
    return this.barcodeRepo.findOneByOrFail({ id });
  }

  getSupportedTypes() {
    return [
      { type: 'code128', label: 'Code 128', example: 'ABC-1234' },
      { type: 'code39', label: 'Code 39', example: 'ABC123' },
      { type: 'ean13', label: 'EAN-13', example: '5901234123457' },
      { type: 'ean8', label: 'EAN-8', example: '96385074' },
      { type: 'upca', label: 'UPC-A', example: '012345678905' },
      { type: 'upce', label: 'UPC-E', example: '01234565' },
      { type: 'itf14', label: 'ITF-14', example: '00012345678905' },
      { type: 'codabar', label: 'Codabar', example: 'A12345B' },
      { type: 'msi', label: 'MSI', example: '1234567' },
      { type: 'pharmacode', label: 'Pharmacode', example: '1234' },
    ];
  }
}
