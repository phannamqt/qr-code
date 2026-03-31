import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DecodeLogEntity } from './entities/decode-log.entity';

@Injectable()
export class DecodeService {
  constructor(
    @InjectRepository(DecodeLogEntity)
    private readonly decodeLogRepo: Repository<DecodeLogEntity>,
  ) {}

  async decodeImage(file: Express.Multer.File): Promise<{
    success: boolean;
    codeType?: string;
    text?: string;
    error?: string;
  }> {
    let codeType: string | null = null;
    let decodedText: string | null = null;
    let isSuccess = false;
    let errorMessage: string | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – zxing-wasm uses package.json exports, not supported with moduleResolution:node
      const { readBarcodesFromImageData } = await import('zxing-wasm/reader');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp');

      // Convert image to raw RGBA buffer using sharp
      const { data, info } = await sharp(file.buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const imageData = {
        data: new Uint8ClampedArray(data),
        width: info.width,
        height: info.height,
      };

      const results = await readBarcodesFromImageData(imageData);

      if (results.length === 0) {
        throw new Error('No barcode or QR code detected in image');
      }

      const first = results[0];
      codeType = first.format;
      decodedText = first.text;
      isSuccess = true;
    } catch (err) {
      errorMessage = err.message;
    }

    // Persist log
    await this.decodeLogRepo.save(
      this.decodeLogRepo.create({
        fileName: file.originalname,
        mimeType: file.mimetype,
        codeType,
        decodedText,
        isSuccess,
        errorMessage,
      }),
    );

    if (!isSuccess) {
      throw new BadRequestException(errorMessage ?? 'Failed to decode image');
    }

    return { success: true, codeType, text: decodedText };
  }
}
