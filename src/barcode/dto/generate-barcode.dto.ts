import { IsEnum, IsOptional, IsString, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { BarcodeType, BarcodeFormat } from '../entities/barcode.entity';

export class GenerateBarcodeDto {
  @IsEnum(BarcodeType, { message: 'Loại barcode không hợp lệ' })
  type: BarcodeType;

  @IsString({ message: 'Nội dung barcode không được để trống' })
  content: string;

  @IsOptional()
  @IsEnum(BarcodeFormat, { message: 'Định dạng không hợp lệ (png, svg, base64)' })
  format?: BarcodeFormat = BarcodeFormat.PNG;

  @IsOptional()
  @IsInt({ message: 'Chiều rộng phải là số nguyên' })
  @Min(50, { message: 'Chiều rộng tối thiểu là 50px' })
  @Max(2000, { message: 'Chiều rộng tối đa là 2000px' })
  width?: number = 200;

  @IsOptional()
  @IsInt({ message: 'Chiều cao phải là số nguyên' })
  @Min(20, { message: 'Chiều cao tối thiểu là 20px' })
  @Max(500, { message: 'Chiều cao tối đa là 500px' })
  height?: number = 80;

  @IsOptional()
  @IsString({ message: 'Màu chữ không hợp lệ' })
  fgColor?: string = '#000000';

  @IsOptional()
  @IsString({ message: 'Màu nền không hợp lệ' })
  bgColor?: string = '#ffffff';

  @IsOptional()
  @IsBoolean({ message: 'showText phải là true hoặc false' })
  showText?: boolean = true;
}
