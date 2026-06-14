import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Governorate } from './entities/governorate.entity';
import { CreateGovernorateDto } from './dto/create-governorate.dto';
import { UpdateGovernorateDto } from './dto/update-governorate.dto';
import { GovernorateNotFoundException } from './exceptions/delivery.exceptions';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Governorate)
    private readonly governorateRepo: Repository<Governorate>,
  ) {}

  async findAll(status?: 'active' | 'inactive' | 'all'): Promise<Governorate[]> {
    const where =
      status === 'all'      ? {} :
      status === 'inactive' ? { is_active: false } :
                              { is_active: true };
    return this.governorateRepo.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Governorate> {
    const gov = await this.governorateRepo.findOne({ where: { id } });
    if (!gov) throw new GovernorateNotFoundException();
    return gov;
  }

  async create(dto: CreateGovernorateDto): Promise<Governorate> {
    const gov = this.governorateRepo.create({
      name: dto.name,
      name_local: dto.name_local ?? null,
      delivery_fee_usd: String(dto.delivery_fee_usd),
    });
    return this.governorateRepo.save(gov);
  }

  async update(id: string, dto: UpdateGovernorateDto): Promise<Governorate> {
    const gov = await this.governorateRepo.findOne({ where: { id } });
    if (!gov) throw new GovernorateNotFoundException();

    if (dto.name !== undefined) gov.name = dto.name;
    if (dto.name_local !== undefined) gov.name_local = dto.name_local ?? null;
    if (dto.delivery_fee_usd !== undefined) gov.delivery_fee_usd = String(dto.delivery_fee_usd);
    if (dto.is_active !== undefined) gov.is_active = dto.is_active;

    return this.governorateRepo.save(gov);
  }
}
