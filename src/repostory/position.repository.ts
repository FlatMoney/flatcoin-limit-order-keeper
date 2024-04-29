import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PositionEntity } from './entity/position-entity';
import { Repository } from 'typeorm';

@Injectable()
export class PositionRepository {
  constructor(
    @InjectRepository(PositionEntity)
    private repository: Repository<PositionEntity>,
  ) {}

  public async save(position: PositionEntity): Promise<PositionEntity> {
    return this.repository.save(position);
  }

  public async saveAll(position: PositionEntity[]): Promise<PositionEntity[]> {
    return this.repository.save(position);
  }

  public async getAll(): Promise<PositionEntity[]> {
    return this.repository.createQueryBuilder().getMany();
  }
}
