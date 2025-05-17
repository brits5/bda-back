import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';

@Entity('datos_fiscales')
export class DatosFiscales {
  @PrimaryGeneratedColumn()
  id_datos_fiscales: number;

  @Column({ nullable: true })
  id_usuario: number;

  @Column({ length: 20 })
  rfc: string;

  @Column({ length: 255 })
  razon_social: string;

  @Column({ length: 255, nullable: true })
  direccion_fiscal: string;

  @Column({ length: 100, nullable: true })
  correo_facturacion: string;

  @Column({ default: false })
  requiere_cfdi: boolean;

  @CreateDateColumn()
  fecha_registro: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  ultima_actualizacion: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.datos_fiscales)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}