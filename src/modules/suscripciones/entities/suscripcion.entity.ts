import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';
import { Campana } from '../../../modules/campanas/entities/campana.entity';
import { MetodoPago } from '../../../modules/pagos/entities/metodo-pago.entity';
import { Donacion } from '../../../modules/donaciones/entities/donacion.entity';

@Entity('suscripciones')
export class Suscripcion {
  @PrimaryGeneratedColumn()
  id_suscripcion: number;

  @Column()
  id_usuario: number;

  @Column({ nullable: true })
  id_campana: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({
    type: 'enum',
    enum: ['Mensual', 'Trimestral', 'Anual'],
    default: 'Mensual',
  })
  frecuencia: string;

  @Column()
  fecha_inicio: Date;

  @Column({ nullable: true })
  fecha_fin: Date;

  @Column()
  proxima_donacion: Date;

  @Column({
    type: 'enum',
    enum: ['Activa', 'Pausada', 'Cancelada', 'Finalizada'],
    default: 'Activa',
  })
  estado: string;

  @Column()
  id_metodo_pago: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_donado: number;

  @Column({ default: 0 })
  total_donaciones: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  ultima_actualizacion: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.suscripciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Campana, (campana) => campana.suscripciones)
  @JoinColumn({ name: 'id_campana' })
  campana: Campana;

  @ManyToOne(() => MetodoPago)
  @JoinColumn({ name: 'id_metodo_pago' })
  metodo_pago: MetodoPago;

  @OneToMany(() => Donacion, (donacion) => donacion.suscripcion)
  donaciones: Donacion[];

  // Helper methods
  isActiva(): boolean {
    return this.estado === 'Activa';
  }

  getNombreFrecuencia(): string {
    return this.frecuencia;
  }

  getProximaDonacionFormateada(): string {
    return this.proxima_donacion ? 
      this.proxima_donacion.toLocaleDateString() : 
      'No programada';
  }

  getProximoIntervalo(): Date {
    const proxima = new Date(this.proxima_donacion);
    
    switch(this.frecuencia) {
      case 'Mensual':
        proxima.setMonth(proxima.getMonth() + 1);
        break;
      case 'Trimestral':
        proxima.setMonth(proxima.getMonth() + 3);
        break;
      case 'Anual':
        proxima.setFullYear(proxima.getFullYear() + 1);
        break;
    }
    
    return proxima;
  }
}