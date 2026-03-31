import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  IsEmail,
  IsPhoneNumber,
  ValidateIf,
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
  @IsEnum(QrCodeFormat)
  format?: QrCodeFormat = QrCodeFormat.PNG;

  @IsOptional()
  @IsEnum(ErrorCorrectionLevel)
  errorCorrection?: ErrorCorrectionLevel = ErrorCorrectionLevel.M;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2000)
  size?: number = 300;

  @IsOptional()
  @IsString()
  fgColor?: string = '#000000';

  @IsOptional()
  @IsString()
  bgColor?: string = '#ffffff';

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  frameStyle?: string;

  @IsOptional()
  @IsString()
  dotStyle?: string = 'square';

  @IsOptional()
  @IsBoolean()
  scanTracking?: boolean = false;
}

// ── Website ──────────────────────────────────────────────────────────────────
export class GenerateWebsiteDto extends QrDesignDto {
  @IsUrl()
  url: string;
}

// ── Text ─────────────────────────────────────────────────────────────────────
export class GenerateTextDto extends QrDesignDto {
  @IsString()
  text: string;
}

// ── vCard (Digital Business Card) ────────────────────────────────────────────
export class GenerateVCardDto extends QrDesignDto {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

// ── WiFi ─────────────────────────────────────────────────────────────────────
export class GenerateWifiDto extends QrDesignDto {
  @IsString()
  ssid: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsEnum(WifiEncryption)
  encryption: WifiEncryption;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean = false;
}

// ── PDF ──────────────────────────────────────────────────────────────────────
export class GeneratePdfDto extends QrDesignDto {
  @IsUrl({ require_tld: false })
  pdfUrl: string;
}

// ── App Store ─────────────────────────────────────────────────────────────────
export class GenerateAppStoreDto extends QrDesignDto {
  @IsOptional()
  @IsUrl()
  iosUrl?: string;

  @IsOptional()
  @IsUrl()
  androidUrl?: string;
}
