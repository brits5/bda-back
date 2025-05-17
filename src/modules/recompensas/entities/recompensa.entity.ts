import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recompensas')
export class Recompensa {
  @PrimaryGeneratedColumn()
  id_recompensa: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column()
  puntos_requeridos: number;

  @Column({
    type: 'enum',
    enum: ['Insignia', 'Certificado', 'Experiencia', 'Descuento'],
  })
  tipo: string;

  @Column({ length: 255, nullable: true })
  imagen_url: string;

  @Column({ default: true })
  activa: boolean;

  @Column({ nullable: true })
  cantidad_disponible: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  // Helper methods
  isDisponible(): boolean {
    return this.activa && (this.cantidad_disponible === null || this.cantidad_disponible > 0);
  }
}