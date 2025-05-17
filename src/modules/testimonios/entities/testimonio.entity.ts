import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('testimonios')
export class Testimonio {
  @PrimaryGeneratedColumn()
  id_testimonio: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  imagen_url: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha_publicacion: Date;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: false })
  destacado: boolean;
}
