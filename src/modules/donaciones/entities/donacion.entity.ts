import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../../../modules/usuarios/entities/usuario.entity';
import { Campana } from '../../../modules/campanas/entities/campana.entity';
import { Comprobante } from '../../../modules/comprobantes/entities/comprobante.entity';
import { Factura } from '../../../modules/facturas/entities/factura.entity';
import { Suscripcion } from '../../../modules/suscripciones/entities/suscripcion.entity';

@Entity('donaciones')
export class Donacion {
  @PrimaryGeneratedColumn()
  id_donacion: number;

  @Column({ nullable: true })
  id_usuario: number;

  @Column({ nullable: true })
  id_campana: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ length: 3, default: 'USD' })
  moneda: string;

  @CreateDateColumn()
  fecha_donacion: Date;

  @Column({
    type: 'enum',
    enum: ['Tarjeta', 'PLUX', 'PayPal'],
  })
  metodo_pago: string;

  @Column({ length: 255 })
  referencia_pago: string;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Completada', 'Fallida', 'Reembolsada'],
    default: 'Pendiente',
  })
  estado: string;

  @Column({ default: false })
  es_anonima: boolean;

  @Column({ default: false })
  requiere_factura: boolean;

  @Column({ length: 100, nullable: true })
  correo_comprobante: string;

  @Column({ default: true })
  acepto_terminos: boolean;

  @Column({ default: false })
  acepto_noticias: boolean;

  @Column({ nullable: true })
  id_suscripcion: number;

  @Column({ default: 0 })
  puntos_otorgados: number;

  @Column({ length: 50, nullable: true })
  ip_donante: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.donaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Campana, (campana) => campana.donaciones)
  @JoinColumn({ name: 'id_campana' })
  campana: Campana;

  @ManyToOne(() => Suscripcion, (suscripcion) => suscripcion.donaciones)
  @JoinColumn({ name: 'id_suscripcion' })
  suscripcion: Suscripcion;

  @OneToMany(() => Comprobante, (comprobante) => comprobante.donacion)
  comprobantes: Comprobante[];

  @OneToMany(() => Factura, (factura) => factura.donacion)
  facturas: Factura[];

  // Helper methods
  isCompletada(): boolean {
    return this.estado === 'Completada';
  }

  getImpactoTexto(): string {
    if (!this.campana || !this.campana.impacto_descripcion) {
      return `Tu donación de $${this.monto} ayuda a nuestra causa.`;
    }

    // Extracción simple del impacto basado en la descripción de la campaña
    const impactoDesc = this.campana.impacto_descripcion;
    if (impactoDesc.includes('$10 =')) {
      const cantidad = Math.floor(this.monto / 10);
      const descripcion = impactoDesc.split('=')[1].trim();
      return `Tu donación de $${this.monto} = ${cantidad} ${descripcion}`;
    } else if (impactoDesc.includes('$20 =')) {
      const cantidad = Math.floor(this.monto / 20);
      const descripcion = impactoDesc.split('=')[1].trim();
      return `Tu donación de $${this.monto} = ${cantidad} ${descripcion}`;
    } else if (impactoDesc.includes('$50 =')) {
      const cantidad = Math.floor(this.monto / 50);
      const descripcion = impactoDesc.split('=')[1].trim();
      return `Tu donación de $${this.monto} = ${cantidad} ${descripcion}`;
    } else if (impactoDesc.includes('$100 =')) {
      const cantidad = Math.floor(this.monto / 100);
      const descripcion = impactoDesc.split('=')[1].trim();
      return `Tu donación de $${this.monto} = ${cantidad} ${descripcion}`;
    }

    return `Tu donación de $${this.monto} ayuda a nuestra causa.`;
  }
}