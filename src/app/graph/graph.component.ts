import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ChartOptions, ChartType, ChartDataset} from 'chart.js';
import {NgChartsModule} from 'ng2-charts';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  imports: [NgChartsModule],
  standalone: true,
})
export class GraphComponent implements OnChanges {
  @Input() constraints: any[] = [];
  @Input() objective: any = {};

  public chartData: ChartDataset[] = [];
  public chartLabels: string[] = [];
  public chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      x: { title: { display: true, text: 'x1' }, min: 0, max: 1000 }, // Aumentar limite de x
      y: { title: { display: true, text: 'x2' }, min: 0, max: 1000 }  // Aumentar limite de y
    }
  };
  public chartType: ChartType = 'line';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['constraints'] || changes['objective']) {
      this.plotGraph();
    }
  }

  private plotGraph(): void {
       if (!this.constraints || !Array.isArray(this.constraints) || this.constraints.length === 0) return;
       if (!this.objective || !this.objective['zx1'] || !this.objective['zx2']) return;
       // process data further...
   }

  private findIntersectionPoints(constraints: any[]) {
    const points: number[][] = [];
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i + 1; j < constraints.length; j++) {
        // Interseção entre duas restrições
        const denominator = constraints[i]['coefX1'] * constraints[j]['coefX2'] -
          constraints[j]['coefX1'] * constraints[i]['coefX2'];
        if (denominator === 0) continue;

        const x = (constraints[j]['coefX2'] * constraints[i]['constant'] - constraints[i]['coefX2'] * constraints[j]['constant']) / denominator;
        const y = (constraints[i]['coefX1'] * constraints[j]['constant'] - constraints[j]['coefX1'] * constraints[i]['constant']) / denominator;

        if (x >= 0 && y >= 0) {
          points.push([x, y]);
        }
      }
    }
    return points;
  }

  private getConstraintLine(constraint: any): { x: number; y: number }[] {
    const points = [];
    const maxX = 10; // Valor máximo no gráfico para x
    const maxY = 10; // Valor máximo no gráfico para y

    const x1Intercept = constraint['constant'] / constraint['coefX1'];
    const x2Intercept = constraint['constant'] / constraint['coefX2'];

    // Adicionar pontos para desenhar a linha da restrição
    if (x1Intercept >= 0) points.push({ x: x1Intercept, y: 0 }); // Intercepto em x
    if (x2Intercept >= 0) points.push({ x: 0, y: x2Intercept }); // Intercepto em y

    // Garantir que a linha vai até o limite do gráfico
    const yAtMaxX = (constraint['constant'] - constraint['coefX1'] * maxX) / constraint['coefX2'];
    if (yAtMaxX >= 0 && yAtMaxX <= maxY) points.push({ x: maxX, y: yAtMaxX });

    return points.sort((a, b) => a.x - b.x); // Ordenar pontos por `x`
  }

  private getObjectiveLine(objective: any): { x: number; y: number }[] {
    const points = [];
    const z = 100; // Valor arbitrário ou ajustável para Z
    const maxX = 10; // Limite no gráfico para x
    const maxY = 10; // Limite no gráfico para y

    // Calcula interceptos nos eixos x1 e x2
    const x1Intercept = z / objective['zx1'];
    const x2Intercept = z / objective['zx2'];

    if (x1Intercept >= 0) points.push({ x: x1Intercept, y: 0 }); // Intercepto em x
    if (x2Intercept >= 0) points.push({ x: 0, y: x2Intercept }); // Intercepto em y

    // Adicionar valor para garantir que cobre o limite do gráfico
    const yAtMaxX = (z - maxX * objective['zx1']) / objective['zx2'];
    if (yAtMaxX >= 0 && yAtMaxX <= maxY) points.push({ x: maxX, y: yAtMaxX });

    return points.sort((a, b) => a.x - b.x); // Ordenar pontos
  }

  private getColor(index: number): string {
    const colors = ['red', 'green', 'purple', 'orange', 'pink'];
    return colors[index % colors.length];
  }
}
