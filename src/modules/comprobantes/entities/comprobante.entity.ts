import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Donacion } from '../../donaciones/entities/donacion.entity';

@Entity('comprobantes')
export class Comprobante {
  @PrimaryGeneratedColumn()
  id_comprobante: number;

  @Column()
  id_donacion: number;

  @Column({ length: 50, unique: true })
  codigo_unico: string;

  @CreateDateColumn()
  fecha_emision: Date;

  @Column({ length: 255 })
  url_pdf: string;

  @Column({ default: false })
  enviado_email: boolean;

  @Column({ nullable: true })
  fecha_envio: Date;

  @Column({ length: 100, nullable: true })
  correo_envio: string;

  // Relaciones
  @ManyToOne(() => Donacion, (donacion) => donacion.comprobantes)
  @JoinColumn({ name: 'id_donacion' })
  donacion: Donacion;

  // Helper methods
  getUrlCompleta(baseUrl: string): string {
    return `${baseUrl}${this.url_pdf}`;
  }

  getCodigoFormateado(): string {
    return this.codigo_unico;
  }
}