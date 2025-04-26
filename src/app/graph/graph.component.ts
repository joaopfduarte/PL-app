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
      x: {title: {display: true, text: 'x1'}, min: 0},
      y: {title: {display: true, text: 'x2'}, min: 0}
    }
  };
  public chartType: ChartType = 'scatter';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['constraints'] || changes['objective']) {
      this.plotGraph();
    }
  }

  private plotGraph(): void {
    if (!this.constraints || !this.objective) return;

    const points = this.findIntersectionPoints(this.constraints);

    const constraintsLines = this.constraints.map((constraint, index) => ({
      label: `Restrição ${index + 1}`,
      data: this.getConstraintLine(constraint),
      borderColor: this.getColor(index),
      fill: false,
      tension: 0
    }));

    const objectiveLine = [{
      label: 'Função Objetivo (Z)',
      data: this.getObjectiveLine(this.objective),
      borderColor: 'blue',
      borderDash: [5, 5],
      fill: false,
      tension: 0
    }];

    this.chartData = [...constraintsLines, ...objectiveLine];
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

  private getConstraintLine(constraint: any) {
    const points = [];
    const x1Intercept = constraint['constant'] / constraint['coefX1'];
    const x2Intercept = constraint['constant'] / constraint['coefX2'];

    if (x1Intercept >= 0) points.push({x: x1Intercept, y: 0});
    if (x2Intercept >= 0) points.push({x: 0, y: x2Intercept});

    return points;
  }

  private getObjectiveLine(objective: any) {
    const points = [];
    const z = 100;
    const x1Intercept = z / objective['zx1'];
    const x2Intercept = z / objective['zx2'];

    if (x1Intercept >= 0) points.push({x: x1Intercept, y: 0});
    if (x2Intercept >= 0) points.push({x: 0, y: x2Intercept});

    return points;
  }

  private getColor(index: number): string {
    const colors = ['red', 'green', 'purple', 'orange', 'pink'];
    return colors[index % colors.length];
  }
}
