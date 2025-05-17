import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Donacion } from '../../../modules/donaciones/entities/donacion.entity';
import { Suscripcion } from '../../../modules/suscripciones/entities/suscripcion.entity';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';

@Entity('campanas')
export class Campana {
  @PrimaryGeneratedColumn()
  id_campana: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 255, nullable: true })
  imagen_url: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  meta_monto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monto_recaudado: number;

  @Column({ default: false })
  es_emergencia: boolean;

  @Column()
  fecha_inicio: Date;

  @Column({ nullable: true })
  fecha_fin: Date;

  @Column({
    type: 'enum',
    enum: ['Activa', 'Finalizada', 'Cancelada'],
    default: 'Activa',
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  impacto_descripcion: string;

  @Column({ default: 0 })
  contador_donaciones: number;

  // Relaciones
  @OneToMany(() => Donacion, (donacion) => donacion.campana)
  donaciones: Donacion[];

  @OneToMany(() => Suscripcion, (suscripcion) => suscripcion.campana)
  suscripciones: Suscripcion[];

  @ManyToMany(() => Usuario, (usuario) => usuario.campanas_seguidas)
  seguidores: Usuario[];

  // Helper methods
  getPorcentajeCompletado(): number {
    if (this.meta_monto <= 0) return 0;
    return Math.min(100, (this.monto_recaudado / this.meta_monto) * 100);
  }

  isActiva(): boolean {
    return this.estado === 'Activa' && 
           (this.fecha_fin === null || this.fecha_fin >= new Date());
  }
}