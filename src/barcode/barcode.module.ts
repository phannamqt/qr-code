import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarcodeEntity } from './entities/barcode.entity';
import { BarcodeService } from './barcode.service';
import { BarcodeController } from './barcode.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BarcodeEntity])],
  controllers: [BarcodeController],
  providers: [BarcodeService],
})
export class BarcodeModule {}
