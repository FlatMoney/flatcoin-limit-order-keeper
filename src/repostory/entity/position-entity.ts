import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../utils/column.numeric.transformer';

@Entity({ name: 'positions' })
export class PositionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'token_id', type: 'numeric', precision: 25, unique: true, nullable: false, transformer: numericTransformer })
  tokenId: number;
}
