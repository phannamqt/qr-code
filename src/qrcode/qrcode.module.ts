import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCodeEntity } from './entities/qrcode.entity';
import { QrCodeService } from './qrcode.service';
import { QrCodeController } from './qrcode.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QrCodeEntity])],
  controllers: [QrCodeController],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
