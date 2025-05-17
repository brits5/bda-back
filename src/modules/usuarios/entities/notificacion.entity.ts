import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id_notificacion: number;

  @Column()
  id_usuario: number;

  @Column({
    type: 'enum',
    enum: ['Donacion', 'Suscripcion', 'Campana', 'Sistema'],
  })
  tipo: string;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ default: false })
  leida: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @Column({ type: 'datetime', nullable: true })
  fecha_lectura: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.notificaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}