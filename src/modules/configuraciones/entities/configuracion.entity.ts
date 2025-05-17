import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configuraciones')
export class Configuracion {
  @PrimaryGeneratedColumn()
  id_configuracion: number;

  @Column({ length: 100, unique: true })
  clave: string;

  @Column({ type: 'text' })
  valor: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: ['texto', 'numero', 'booleano', 'json'],
    default: 'texto',
  })
  tipo: string;

  @Column({ default: true })
  editable: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_actualizacion: Date;

  // Helper methods
  getValorTipado(): any {
    switch (this.tipo) {
      case 'numero':
        return parseFloat(this.valor);
      case 'booleano':
        return this.valor === 'true' || this.valor === '1';
      case 'json':
        try {
          return JSON.parse(this.valor);
        } catch (e) {
          return null;
        }
      default:
        return this.valor;
    }
  }
}