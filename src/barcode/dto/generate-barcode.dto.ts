import { IsEnum, IsOptional, IsString, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { BarcodeType, BarcodeFormat } from '../entities/barcode.entity';

export class GenerateBarcodeDto {
  @IsEnum(BarcodeType)
  type: BarcodeType;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(BarcodeFormat)
  format?: BarcodeFormat = BarcodeFormat.PNG;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(2000)
  width?: number = 200;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(500)
  height?: number = 80;

  @IsOptional()
  @IsString()
  fgColor?: string = '#000000';

  @IsOptional()
  @IsString()
  bgColor?: string = '#ffffff';

  @IsOptional()
  @IsBoolean()
  showText?: boolean = true;
}
