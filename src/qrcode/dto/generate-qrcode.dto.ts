import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import {
  QrCodeFormat,
  ErrorCorrectionLevel,
} from '../entities/qrcode.entity';

export enum WifiEncryption {
  WPA = 'WPA',
  WEP = 'WEP',
  NONE = 'nopass',
}

// ── Base design options shared across all types ─────────────────────────────
class QrDesignDto {
  @IsOptional()
  @IsEnum(QrCodeFormat, { message: 'Định dạng không hợp lệ (png, svg, base64)' })
  format?: QrCodeFormat = QrCodeFormat.PNG;

  @IsOptional()
  @IsEnum(ErrorCorrectionLevel, { message: 'Mức sửa lỗi không hợp lệ (L, M, Q, H)' })
  errorCorrection?: ErrorCorrectionLevel = ErrorCorrectionLevel.M;

  @IsOptional()
  @IsInt({ message: 'Kích thước phải là số nguyên' })
  @Min(100, { message: 'Kích thước tối thiểu là 100px' })
  @Max(2000, { message: 'Kích thước tối đa là 2000px' })
  size?: number = 300;

  @IsOptional()
  @IsString({ message: 'Màu chữ không hợp lệ' })
  fgColor?: string = '#000000';

  @IsOptional()
  @IsString({ message: 'Màu nền không hợp lệ' })
  bgColor?: string = '#ffffff';

  @IsOptional()
  @IsString({ message: 'Logo URL không hợp lệ' })
  logoUrl?: string;

  @IsOptional()
  @IsString({ message: 'Kiểu khung không hợp lệ' })
  frameStyle?: string;

  @IsOptional()
  @IsString({ message: 'Kiểu chấm không hợp lệ' })
  dotStyle?: string = 'square';

  @IsOptional()
  @IsBoolean({ message: 'scanTracking phải là true hoặc false' })
  scanTracking?: boolean = false;
}

// ── Website ──────────────────────────────────────────────────────────────────
export class GenerateWebsiteDto extends QrDesignDto {
  @IsNotEmpty({ message: 'URL không được để trống' })
  @IsUrl({}, { message: 'URL không hợp lệ' })
  url: string;
}

// ── Text ─────────────────────────────────────────────────────────────────────
export class GenerateTextDto extends QrDesignDto {
  @IsNotEmpty({ message: 'Nội dung văn bản không được để trống' })
  @IsString({ message: 'Nội dung không hợp lệ' })
  text: string;
}

// ── vCard (Digital Business Card) ────────────────────────────────────────────
export class GenerateVCardDto extends QrDesignDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên không hợp lệ' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'Họ không hợp lệ' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Tên công ty không hợp lệ' })
  organization?: string;

  @IsOptional()
  @IsString({ message: 'Chức danh không hợp lệ' })
  title?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Website không hợp lệ' })
  website?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ không hợp lệ' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Thành phố không hợp lệ' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'Quốc gia không hợp lệ' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú không hợp lệ' })
  note?: string;
}

// ── WiFi ─────────────────────────────────────────────────────────────────────
export class GenerateWifiDto extends QrDesignDto {
  @IsNotEmpty({ message: 'Tên mạng (SSID) không được để trống' })
  @IsString({ message: 'Tên mạng (SSID) không hợp lệ' })
  ssid: string;

  @IsOptional()
  @IsString({ message: 'Mật khẩu không hợp lệ' })
  password?: string;

  @IsEnum(WifiEncryption, { message: 'Kiểu mã hóa không hợp lệ (WPA, WEP, nopass)' })
  encryption: WifiEncryption;

  @IsOptional()
  @IsBoolean({ message: 'hidden phải là true hoặc false' })
  hidden?: boolean = false;
}

// ── PDF ──────────────────────────────────────────────────────────────────────
export class GeneratePdfDto extends QrDesignDto {
  @IsNotEmpty({ message: 'URL file PDF không được để trống' })
  @IsUrl({ require_tld: false }, { message: 'URL file PDF không hợp lệ' })
  pdfUrl: string;
}

// ── App Store ─────────────────────────────────────────────────────────────────
export class GenerateAppStoreDto extends QrDesignDto {
  @IsOptional()
  @IsUrl({}, { message: 'URL App Store không hợp lệ' })
  iosUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL Google Play không hợp lệ' })
  androidUrl?: string;

  // Đảm bảo ít nhất một URL được cung cấp — validated ở service
}
