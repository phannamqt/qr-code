import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('decode_logs')
export class DecodeLogEntity extends BaseEntity {
  @Column({ name: 'file_name', type: 'varchar' })
  fileName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'code_type', type: 'varchar', length: 50, nullable: true })
  codeType: string;

  @Column({ name: 'decoded_text', type: 'text', nullable: true })
  decodedText: string;

  @Column({ name: 'is_success', type: 'boolean', default: false })
  isSuccess: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;
}
