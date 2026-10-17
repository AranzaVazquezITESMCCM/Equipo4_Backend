import { Injectable } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { RolResponseDto } from './dto/rol-response.dto';

/** Lectura del catálogo de roles. */
@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  /** Lista todos los roles. */
  async findAll(): Promise<RolResponseDto[]> {
    const roles = await this.repository.findAll();
    return roles.map((r) => RolResponseDto.fromEntity(r));
  }
}
