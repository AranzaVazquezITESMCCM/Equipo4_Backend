import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { UpdateMyProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly repository: UsuariosRepository) {}

  async findAll(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.repository.findAll();
    return usuarios.map((u) => UsuarioResponseDto.fromEntity(u));
  }

  async findOne(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.repository.findById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return UsuarioResponseDto.fromEntity(usuario);
  }

  async update(
    id: string,
    changes: UpdateMyProfileDto,
  ): Promise<UsuarioResponseDto> {
    const existe = await this.repository.findById(id);
    if (!existe) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    const actualizado = await this.repository.update(id, { ...changes });
    return UsuarioResponseDto.fromEntity(actualizado!);
  }

  async findMe(id: string): Promise<UsuarioResponseDto> {
    return this.findOne(id);
  }

  async updateMe(
    id: string,
    changes: UpdateMyProfileDto,
  ): Promise<UsuarioResponseDto> {
    return this.update(id, changes);
  }
}
