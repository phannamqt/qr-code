import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { QrCodeModule } from './qrcode/qrcode.module';
import { BarcodeModule } from './barcode/barcode.module';
import { DecodeModule } from './decode/decode.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'qr_code'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    ServeStaticModule.forRoot(
      {
        rootPath: path.join(process.cwd(), 'public'),
        // serves index.html at / — API routes take priority
      },
      {
        rootPath: path.join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
      },
    ),

    QrCodeModule,
    BarcodeModule,
    DecodeModule,
    UploadModule,
  ],
})
export class AppModule {}
