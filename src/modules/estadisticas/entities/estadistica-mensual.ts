import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('estadisticas_mensuales')
export class EstadisticaMensual {
  @PrimaryColumn()
  ano: number;

  @PrimaryColumn()
  mes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_donaciones: number;

  @Column({ default: 0 })
  contador_donaciones: number;

  @Column({ default: 0 })
  contador_donantes_unicos: number;

  @Column({ default: 0 })
  contador_nuevos_donantes: number;

  @Column({ default: 0 })
  contador_suscripciones_nuevas: number;

  @Column({ default: 0 })
  contador_suscripciones_canceladas: number;

  @Column({ nullable: true })
  campana_principal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monto_promedio: number;

  // Helper methods
  getNombreMes(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[this.mes - 1];
  }

  getPeriodoFormateado(): string {
    return `${this.getNombreMes()} ${this.ano}`;
  }
}