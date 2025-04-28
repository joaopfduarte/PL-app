import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  standalone: true,
  imports: [NgChartsModule]
})
export class GraphComponent implements OnChanges {
  @Input() constraints: { type: string; coefX1: number; coefX2: number; constant: number }[] = [];
  @Input() objective: { zx1: number; zx2: number } | null = { zx1: 0, zx2: 0 };
  @Input() points: number[][] = [];

  public chartData: ChartConfiguration['data'] = {
    datasets: []
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: 'x1' },
        min: 0
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'x2' },
        min: 0
      }
    }
  };

  public chartType: ChartType = 'scatter';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['constraints'] || changes['objective'] || changes['points']) {
      this.plotGraph();
    }
  }

  private plotGraph(): void {
    if (!this.constraints || !Array.isArray(this.constraints) || this.constraints.length === 0) return;
    if (!this.objective) return;

    const datasets: any[] = [];
    const allPoints: Point[] = [];

    // Plot constraints
    this.constraints.forEach((constraint, index) => {
      const linePoints = this.getConstraintLine(constraint);
      if (linePoints.length > 0) {
        datasets.push({
          data: linePoints,
          label: `Restrição ${index + 1}`,
          borderColor: this.getColor(index),
          backgroundColor: this.getColor(index),
          fill: false,
          pointRadius: 0,
          showLine: true,
          type: 'line'
        });
        allPoints.push(...linePoints);
      }
    });

    // Plot objective function
    const objectiveLine = this.getObjectiveLine(this.objective);
    if (objectiveLine.length > 0) {
      datasets.push({
        data: objectiveLine,
        label: 'Função Objetivo',
        borderColor: 'blue',
        backgroundColor: 'blue',
        fill: false,
        pointRadius: 0,
        showLine: true,
        type: 'line'
      });
      allPoints.push(...objectiveLine);
    }

    // Plot intersection points
    if (this.points && this.points.length > 0) {
      const pointsData = this.points.map(p => ({ x: p[0], y: p[1] }));
      datasets.push({
        data: pointsData,
        label: 'Pontos de Interseção',
        backgroundColor: 'red',
        borderColor: 'red',
        pointRadius: 5,
        showLine: false,
        type: 'scatter'
      });
      allPoints.push(...pointsData);
    }

    // Update chart scales
    if (allPoints.length > 0) {
      const xValues = allPoints.map(p => p.x);
      const yValues = allPoints.map(p => p.y);
      if (this.chartOptions?.scales) {
        const scales = this.chartOptions.scales as any;
        scales.x = {
          ...scales.x,
          min: 0,
          max: Math.max(...xValues) + 1
        };
        scales.y = {
          ...scales.y,
          min: 0,
          max: Math.max(...yValues) + 1
        };
      }
    }

    this.chartData = {
      datasets: datasets
    };
  }

  private getConstraintLine(constraint: { coefX1: number; coefX2: number; constant: number }): Point[] {
    const points: Point[] = [];
    const xIntercept = constraint.constant / constraint.coefX1;
    const yIntercept = constraint.constant / constraint.coefX2;

    if (xIntercept >= 0) points.push({ x: xIntercept, y: 0 });
    if (yIntercept >= 0) points.push({ x: 0, y: yIntercept });

    return points;
  }

  private getObjectiveLine(objective: { zx1: number; zx2: number }): Point[] {
    const points: Point[] = [];

    if (!this.points || this.points.length === 0) return points;

    const z = Math.max(10, Math.max(...this.points.map(p => p[0] * objective.zx1 + p[1] * objective.zx2)));

    if (objective.zx1 !== 0) {
      const x = z / objective.zx1;
      if (x >= 0) points.push({ x, y: 0 });
    }

    if (objective.zx2 !== 0) {
      const y = z / objective.zx2;
      if (y >= 0) points.push({ x: 0, y });
    }

    return points.sort((a, b) => a.x - b.x);
  }

  private getColor(index: number): string {
    const colors = ['red', 'green', 'purple', 'orange', 'pink'];
    return colors[index % colors.length];
  }
}
