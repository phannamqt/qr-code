import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecodeLogEntity } from './entities/decode-log.entity';
import { DecodeService } from './decode.service';
import { DecodeController } from './decode.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DecodeLogEntity])],
  controllers: [DecodeController],
  providers: [DecodeService],
})
export class DecodeModule {}
