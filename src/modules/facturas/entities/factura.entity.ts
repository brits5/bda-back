import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Donacion } from '../../../modules/donaciones/entities/donacion.entity';
import { DatosFiscales } from './datos-fiscales.entity';

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn()
  id_factura: number;

  @Column()
  id_donacion: number;

  @Column()
  id_datos_fiscales: number;

  @Column({ length: 50, unique: true })
  numero_factura: string;

  @CreateDateColumn()
  fecha_emision: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  impuestos: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ length: 255 })
  url_pdf: string;

  @Column({ default: false })
  enviada_email: boolean;

  @Column({ nullable: true })
  fecha_envio: Date;

  @Column({ default: false })
  enviada_sat: boolean;

  @Column({
    type: 'enum',
    enum: ['Emitida', 'Cancelada'],
    default: 'Emitida',
  })
  estado: string;

  // Relaciones
  @ManyToOne(() => Donacion, (donacion) => donacion.facturas)
  @JoinColumn({ name: 'id_donacion' })
  donacion: Donacion;

  @ManyToOne(() => DatosFiscales)
  @JoinColumn({ name: 'id_datos_fiscales' })
  datos_fiscales: DatosFiscales;

  // Helper methods
  getUrlCompleta(baseUrl: string): string {
    return `${baseUrl}${this.url_pdf}`;
  }

  getNumeroFormateado(): string {
    return this.numero_factura;
  }
}