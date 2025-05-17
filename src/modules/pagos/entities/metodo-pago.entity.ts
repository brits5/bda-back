import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';

@Entity('metodos_pago')
export class MetodoPago {
  @PrimaryGeneratedColumn()
  id_metodo_pago: number;

  @Column({ nullable: true })
  id_usuario: number;

  @Column({
    type: 'enum',
    enum: ['Tarjeta', 'PLUX', 'PayPal'],
  })
  tipo: string;

  @Column({ length: 255 })
  token_referencia: string;

  @Column({ length: 100, nullable: true })
  alias: string;

  @Column({ length: 4, nullable: true })
  ultimo_digitos: string;

  @Column({ length: 100, nullable: true })
  banco: string;

  @Column({ length: 50, nullable: true })
  tipo_cuenta: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_registro: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  ultima_actualizacion: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.metodos_pago)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  // Helper methods
  getNombreFormateado(): string {
    if (this.alias) {
      return this.alias;
    }

    if (this.tipo === 'Tarjeta' && this.ultimo_digitos) {
      return `Tarjeta terminada en ${this.ultimo_digitos}`;
    }

    if (this.tipo === 'PLUX') {
      return 'Cuenta PLUX';
    }

    if (this.tipo === 'PayPal') {
      return 'Cuenta PayPal';
    }

    return 'Método de pago';
  }
}