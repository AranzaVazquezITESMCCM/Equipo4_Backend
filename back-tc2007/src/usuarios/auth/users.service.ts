import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { generateSalt, hashPassword, verifyPassword } from '../../common/password.util';
import { randomInt } from 'node:crypto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { sign, verify } from './jwt';
import { UsersRepository } from './users.repository';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';




/** Vida del access token: 15 minutos (en segundos). */
const ACCESS_TTL = 15 * 60;
/** Vida del refresh token: 7 días (en segundos). */
const REFRESH_TTL = 7 * 24 * 60 * 60;

/**
 * Lógica de autenticación detrás de {@link AuthController}.
 *
 * Maneja el alta de cuentas, el inicio de sesión con emisión de JWT
 * (access + refresh), la aprobación de administradores y la
 * recuperación de contraseña por código enviado al correo.
 *
 * Las contraseñas nunca se guardan en claro: cada cuenta tiene su
 * propio `salt` y se almacena solo el hash (ver `password.util`).
 *
 * Roles relevantes para este servicio (`rolId`):
 * - `2` y `3`: roles con acceso al dashboard de administración.
 * - `4`: solicitud de administrador pendiente de aprobación; no puede
 *   iniciar sesión por ningún flujo hasta ser aprobada.
 */
@Injectable()
export class AuthService {
   /** Bitácora de auditoría de la recuperación de contraseña. */
  private readonly auditoria = new Logger('RecuperacionContrasena');
  constructor(private readonly users: UsersRepository) {}

  /**
   * Transporte de correo para enviar los códigos de recuperación.
   * Usa Gmail con una contraseña de aplicación; las credenciales
   * vienen de `GMAIL_USER` y `GMAIL_APP_PASSWORD`.
   */
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  /**
   * Registra un usuario final con el rol por defecto que asigne
   * {@link UsersRepository.save}.
   *
   * @throws ConflictException si el email ya está registrado.
   * @returns Solo `id` y `email`; nunca se devuelven hash ni salt.
   */
  async register(dto: RegisterDto): Promise<{ id: string; email: string }> {
    if (await this.users.findByEmail(dto.email!)) {
      throw new ConflictException('El email ya está registrado');
    }
    const salt = generateSalt();
    const user = await this.users.save(
            dto.email!,
            hashPassword(dto.password!, salt),
            salt,
            dto.nombre!,
        );
    return { id: user.id!, email: user.email! };
  }

  /**
   * Registra una solicitud de administrador. Es idéntico a
   * {@link register} salvo que persiste con
   * {@link UsersRepository.saveAdmin}, que deja la cuenta como
   * pendiente (`rolId = 4`) hasta que la apruebe un super administrador
   * mediante {@link approveAdmin}.
   *
   * @throws ConflictException si el email ya está registrado.
   */
  async registerAdmin(dto: RegisterDto,): Promise<{ id: string; email: string }> {
    if (await this.users.findByEmail(dto.email!)) {
      throw new ConflictException('El email ya está registrado');
    }
    const salt = generateSalt();
    const user = await this.users.saveAdmin(
      dto.email!,
      hashPassword(dto.password!, salt),
      salt,
      dto.nombre!,
    );

    return { id: user.id!, email: user.email! };
  }

  /**
   * Inicio de sesión de usuario final. Verifica credenciales, bloquea
   * a los administradores pendientes y emite un par de tokens con los
   * mismos claims (`sub`, `email`, `rolId`), diferenciados por `type`.
   *
   * A diferencia de {@link adminLogin}, los mensajes de error indican
   * si falló el usuario o la contraseña, lo que permite saber qué
   * correos están registrados.
   *
   * @throws UnauthorizedException si el usuario no existe, la
   * contraseña es incorrecta o es un administrador pendiente.
   */
  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.users.findByEmail(dto.email!);

    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (!verifyPassword(dto.password!, user.salt!, user.passwordHash!)) {
      throw new UnauthorizedException('Password incorrecto');
    }

    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (user.rolId === 4) {
      throw new UnauthorizedException('Tu solicitud de administrador está pendiente de aprobación');
    }

    const claims = { sub: user.id!, email: user.email!, rolId: user.rolId!};

    const accessToken = sign(
      { ...claims, type: 'access' },
      ACCESS_TTL,
    );

    const refreshToken = sign(
      { ...claims, type: 'refresh' },
      REFRESH_TTL,
    );

    console.log('Login de ' + user.email + ': ' + accessToken);

    return { accessToken, refreshToken };
  }

  /**
   * Inicio de sesión del dashboard. Solo admite roles `2` y `3`, lo
   * que deja fuera tanto a usuarios finales como a administradores
   * pendientes (`4`).
   *
   * Usuario inexistente y contraseña incorrecta responden con el mismo
   * mensaje genérico para no revelar qué correos existen.
   *
   * @throws UnauthorizedException si las credenciales son incorrectas
   * o el rol no tiene acceso al dashboard.
   */
  async adminLogin(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.users.findByEmail(dto.email!);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!verifyPassword(dto.password!, user.salt!,user.passwordHash!)) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.rolId !== 2 && user.rolId !== 3) {
      throw new UnauthorizedException('No tienes permisos para acceder al dashboard');
    }

    const claims = {sub: user.id!, email: user.email!, rolId: user.rolId!};

    const accessToken = sign(
      { ...claims, type: 'access' },
      ACCESS_TTL,
    );

    const refreshToken = sign(
      { ...claims, type: 'refresh' },
      REFRESH_TTL,
    );

    return { accessToken, refreshToken };
  }

  /** Devuelve las solicitudes de administrador aún no aprobadas. */
  async getPendingAdmins() {
    return this.users.findPendingAdmins();
  }

  /**
   * Aprueba una solicitud de administrador pendiente.
   *
   * @throws NotFoundException si el id no corresponde a una solicitud
   * pendiente (no existe o ya fue aprobada).
   */
  async approveAdmin(id: string) {
    const approved = await this.users.approveAdmin(id);

    if (!approved) {
      throw new NotFoundException('No se encontró una solicitud pendiente');
    }

    return {
      message: 'Administrador aprobado correctamente'
    };
  }

    async rejectAdmin(id: string) {
    const rejected = await this.users.rejectAdmin(id);
    if (!rejected) {
      throw new NotFoundException('No se encontró una solicitud pendiente');
    }
    return { message: 'Solicitud rechazada' };
  }

  async revokeAdmin(id: string, solicitanteId: string) {
    if (id === solicitanteId) {
      throw new BadRequestException('No puedes quitarte el acceso a ti mismo');
    }
    const rolId = await this.users.findRolId(id);
    if (rolId !== 2 && rolId !== 3) {
      throw new NotFoundException('No se encontró un administrador con ese id');
    }
    if (rolId === 3 && (await this.users.countSuperAdmins()) <= 1) {
      throw new BadRequestException('No se puede quitar el acceso al último super administrador');
    }
    await this.users.revokeAdmin(id);
    return { message: 'Acceso retirado correctamente' };
  }


  /**
   * Emite un nuevo access token a partir de un refresh token válido.
   * Es síncrono porque no consulta la base: copia los claims del
   * refresh token tal cual.
   *
   * Consecuencia: si al usuario se le cambia el rol o se le da de baja,
   * los access tokens renovados conservan el `rolId` anterior hasta que
   * expire el refresh token (hasta 7 días). Tampoco se rota el refresh
   * token; se reutiliza el mismo durante toda su vida.
   *
   * @throws UnauthorizedException si el token es inválido, expiró o no
   * es de tipo `refresh` (evita usar un access token para renovar).
   */
  refresh(dto: RefreshDto): { accessToken: string } {
    const payload = verify(dto.refreshToken!);

    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const accessToken = sign(
      {
        sub: payload.sub,
        email: payload.email,
        rolId: payload.rolId,
        type: 'access',
      },
      ACCESS_TTL,
    );

    return { accessToken };
  }

  /**
   * Genera un código de recuperación de 6 caracteres, lo guarda con
   * vigencia de 15 minutos y lo envía al correo del usuario.
   *
   * El alfabeto excluye caracteres ambiguos (`0/O`, `1/I/L`) para que
   * el código sea fácil de transcribir, y se usa `randomInt` de
   * `node:crypto` en lugar de `Math.random` porque es
   * criptográficamente seguro.
   *
   * @throws UnauthorizedException si el correo no está registrado.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.users.findByEmail(email);
    if (!user) {
       this.auditoria.warn(`Solicitud de código FALLIDA: correo no registrado (${email})`);
      throw new UnauthorizedException('El usuario no existe');
    }
    const caracteres = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += caracteres[randomInt(caracteres.length)];
    }
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
    await this.users.createRecoveryCode(user.id!, codigo, expiraEn);
    await this.transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Código de recuperación - Ofraud Stay',
      text: `Tu código de recuperación es: ${codigo}
    Este código es válido por 15 minutos y solo puede usarse una vez.`,
    });
        this.auditoria.log(`Código de recuperación enviado a ${email} (usuario ${user.id})`);
    return {
      message: 'Se generó el código de recuperación',
    };
  }

async verifyCode(correo: string, codigo: string): Promise<{ message: string }> {
  const user = await this.users.findByEmail(correo);
  if (!user) {
    this.auditoria.warn(`Verificación de código FALLIDA: correo no registrado (${correo})`);
    throw new UnauthorizedException('Código inválido');
  }
  const recovery = await this.users.findRecoveryCode(user.id!, codigo);
  if (!recovery || recovery.usado) {
    this.auditoria.warn(`Verificación de código FALLIDA para ${correo}: código inválido o ya usado`);
    throw new UnauthorizedException('Código inválido o ya utilizado');
  }
  this.auditoria.log(`Código verificado correctamente para ${correo}`);
  return { message: 'Código válido' };
}

async resetPassword(dto: { correo: string; codigo: string; nuevaContrasena: string }) {
  // 1. Buscar usuario
  const user = await this.users.findByEmail(dto.correo);
  if (!user) {
    this.auditoria.warn(`Restablecimiento FALLIDO: correo no registrado (${dto.correo})`);
    throw new UnauthorizedException('El correo o código es inválido');
  }

  // 2. Buscar y validar código de recuperación activo
  const recovery = await this.users.findRecoveryCode(user.id!, dto.codigo);
  
 if (!recovery || Boolean(recovery.usado) || new Date() > new Date(recovery.expira_en)) {
    this.auditoria.warn(`Restablecimiento FALLIDO para ${dto.correo}: código incorrecto, usado o expirado`);
    throw new UnauthorizedException('El código es incorrecto o ya expiró');
  }

  // 3. Marcar código como usado
  await this.users.useRecoveryCode(recovery.id);

  // 4. Generar salt y hash usando las utilidades nativas
  const newSalt = generateSalt();
  const newHash = hashPassword(dto.nuevaContrasena, newSalt);

  // 5. Actualizar ambos valores en la base de datos
  await this.users.updatePassword(user.id!, newHash, newSalt);
   this.auditoria.log(`Contraseña restablecida para ${dto.correo} (usuario ${user.id})`);

  return { message: 'Contraseña actualizada correctamente' };
}
}