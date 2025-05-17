import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';
import { Recompensa } from '../entities/recompensa.entity';

@Entity('usuarios_recompensas')
export class UsuarioRecompensa {
  @PrimaryColumn()
  id_usuario: number;

  @PrimaryColumn()
  id_recompensa: number;

  @CreateDateColumn()
  fecha_obtencion: Date;

  @Column()
  puntos_usados: number;

  @PrimaryColumn({ length: 50 })
  codigo_unico: string;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Entregada', 'Canjeada', 'Expirada'],
    default: 'Pendiente',
  })
  estado: string;

  @Column({ nullable: true })
  fecha_entrega: Date;

  @Column({ type: 'text', nullable: true })
  notas: string;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.recompensas)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Recompensa)
  @JoinColumn({ name: 'id_recompensa' })
  recompensa: Recompensa;

  // Helper methods
  isEntregada(): boolean {
    return this.estado === 'Entregada' || this.estado === 'Canjeada';
  }

  getUrlCertificado(baseUrl: string): string {
    if (this.recompensa && this.recompensa.tipo === 'Certificado') {
      return `${baseUrl}/certificados/${this.codigo_unico}.pdf`;
    }
    return '';
  }
}