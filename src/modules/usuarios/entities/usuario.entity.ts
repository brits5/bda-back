import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Donacion } from '../../../modules/donaciones/entities/donacion.entity';
import { Suscripcion } from '../../../modules/suscripciones/entities/suscripcion.entity';
import { DatosFiscales } from '../../../modules/facturas/entities/datos-fiscales.entity';
import { MetodoPago } from '../../../modules/pagos/entities/metodo-pago.entity';
import { Notificacion } from '../../../modules/usuarios/entities/notificacion.entity';
import { UsuarioRecompensa } from '../../../modules/recompensas/entities/usuario-recompensa.entity';
import { Campana } from '../../../modules/campanas/entities/campana.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 20, nullable: true })
  cedula: string;

  @Column({ nullable: true })
  fecha_nacimiento: Date;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @Column({ length: 100, nullable: true })
  ciudad: string;

  @Column({ length: 100, nullable: true })
  provincia: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, unique: true })
  correo: string;

  @Column({ length: 255, nullable: true })
  @Exclude()
  password: string;

  @CreateDateColumn()
  fecha_registro: Date;

  @Column({ nullable: true })
  ultimo_login: Date;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: 0 })
  puntos_acumulados: number;

  @Column({
    type: 'enum',
    enum: ['Bronce', 'Plata', 'Oro', 'Platino'],
    default: 'Bronce',
  })
  nivel_donante: string;

  // Relaciones
  @OneToMany(() => Donacion, (donacion) => donacion.usuario)
  donaciones: Donacion[];

  @OneToMany(() => Suscripcion, (suscripcion) => suscripcion.usuario)
  suscripciones: Suscripcion[];

  @OneToMany(() => DatosFiscales, (datosFiscales) => datosFiscales.usuario)
  datos_fiscales: DatosFiscales[];

  @OneToMany(() => MetodoPago, (metodoPago) => metodoPago.usuario)
  metodos_pago: MetodoPago[];

  @OneToMany(() => Notificacion, (notificacion) => notificacion.usuario)
  notificaciones: Notificacion[];

  @OneToMany(() => UsuarioRecompensa, (usuarioRecompensa) => usuarioRecompensa.usuario)
  recompensas: UsuarioRecompensa[];
  
  @ManyToMany(() => Campana)
  @JoinTable({
    name: 'usuarios_campanas',
    joinColumn: { name: 'id_usuario', referencedColumnName: 'id_usuario' },
    inverseJoinColumn: { name: 'id_campana', referencedColumnName: 'id_campana' },
  })
  campanas_seguidas: Campana[];

  // Helper methods
  getNombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`;
  }
}