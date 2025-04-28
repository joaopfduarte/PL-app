import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormGroup, FormBuilder, FormArray, ReactiveFormsModule, Validators} from '@angular/forms';
import {Chart, ChartConfiguration, ChartType} from 'chart.js/auto';

interface Constraint {
  coefX1: string;
  coefX2: string;
  operator: string;
  constant: string;
}

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-math',
  templateUrl: './math.component.html',
  styleUrls: ['./math.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MathComponent implements OnInit {
  mathForm: FormGroup;
  private chart: Chart | undefined;

  constructor(private fb: FormBuilder) {
    this.mathForm = this.fb.group({
      problemType: ['max', Validators.required],
      objective: this.fb.group({
        zx1: ['', Validators.required],
        zx2: ['', Validators.required]
      }),
      constraints: this.fb.array([])
    });
  }

  ngOnInit() {
    this.addConstraint();
  }

  get constraints() {
    return this.mathForm.get('constraints') as FormArray;
  }

  addConstraint() {
    const constraint = this.fb.group({
      coefX1: ['', Validators.required],
      coefX2: ['', Validators.required],
      operator: ['<=', Validators.required],
      constant: ['', Validators.required]
    });

    this.constraints.push(constraint);
  }

  removeConstraint(index: number) {
    if (this.constraints.length > 1) {
      this.constraints.removeAt(index);
    }
  }

  private findIntersectionPoints(constraints: any[]): number[][] {
    const equations = this.convertConstraintsIntoEquations(constraints);
    const allConstraints = [...constraints,
      {x: 1, y: 0, type: ">=", rhs: 0},
      {x: 0, y: 1, type: ">=", rhs: 0}
    ];

    const points: number[][] = [];

    for (let i = 0; i < equations.length; i++) {
      for (let j = i + 1; j < equations.length; j++) {
        const eq1 = equations[i];
        const eq2 = equations[j];

        const denominator = eq1.a * eq2.b - eq2.a * eq1.b;
        if (denominator === 0) continue;

        const x = (eq2.b * eq1.c - eq1.b * eq2.c) / denominator;
        const y = (eq1.a * eq2.c - eq2.a * eq1.c) / denominator;

        points.push([Number(x.toFixed(4)), Number(y.toFixed(4))]);
      }
    }

    let allPoints = points.filter(point =>
      allConstraints.every(c => {
        if (point[0] == 0 && point[1] == 0) {
          return false;
        }
        const value = Number(c.x * point[0] + c.y * point[1]).toFixed(0);
        return c.type === "<=" ? Number(value) <= c.rhs :
          c.type === ">=" ? Number(value) >= c.rhs : true;
      })
    );

    return allPoints.map(e => {
      return [Number(Number(e[0]).toFixed(2)), Number(Number(e[1]).toFixed(2))];
    });
  }

  private convertConstraintsIntoEquations(constraints: any[]) {
    const equations = [];
    const allConstraints = [...constraints,
      {x: 1, y: 0, type: ">=", rhs: 0},
      {x: 0, y: 1, type: ">=", rhs: 0}
    ];

    for (const c of allConstraints) {
      equations.push({
        a: c.x,
        b: c.y,
        c: c.rhs,
        type: c.type
      });
    }

    return equations;
  }

  getZFunction() {
    const objective = this.mathForm.get('objective')?.value;
    if (!objective) return null;

    const zx1 = parseFloat(objective.zx1);
    const zx2 = parseFloat(objective.zx2);

    if (isNaN(zx1) || isNaN(zx2)) {
      alert("Função Z inválida!");
      return null;
    }

    return {zx1, zx2};
  }

  getProblemType(): string {
    return this.mathForm.get('problemType')?.value?.toLowerCase() || 'max';
  }

  getConstraints() {
    const constraints = [];
    const constraintElements = document.getElementsByClassName('constraint');

    for (let elem of Array.from(constraintElements)) {
      const coefX1 = (elem.querySelector('.coef-x1') as HTMLInputElement)?.value;
      const coefX2 = (elem.querySelector('.coef-x2') as HTMLInputElement)?.value;
      const constant = (elem.querySelector('.const') as HTMLInputElement)?.value;
      const operator = (elem.querySelector('.operator') as HTMLSelectElement)?.value;

      if (!coefX1 || !coefX2 || !constant) {
        alert("Preencha todos os campos da restrição!");
        return null;
      }

      constraints.push({
        x: parseFloat(coefX1),
        y: parseFloat(coefX2),
        type: operator,
        rhs: parseFloat(constant)
      });
    }

    const points = this.findIntersectionPoints(constraints);
    if (points.length === 0) {
      alert("O problema não possui solução");
      return null;
    }

    const uniquePoints = Array.from(
      new Set(points.map(point => JSON.stringify(point)))
    ).map(point => JSON.parse(point as string));

    return {
      constraints: constraints,
      pontos: uniquePoints
    };
  }

  calculateSolution() {
    this.cleanTable();
    const z = this.getZFunction();
    if (!z) return;

    const result = this.getConstraints();
    if (!result || !result.pontos || result.pontos.length === 0) {
      alert("O problema não possui solução");
      return;
    }

    let bestPoint = null;
    let bestValue = this.getProblemType() === "max" ? -Infinity : Infinity;

    for (const point of result.pontos) {
      this.addRow(
        `${z.zx1} x (${point[0]}) +`,
        `${z.zx2} x (${point[1]}) = `,
        `${z.zx1 * point[0] + z.zx2 * point[1]}`
      );
      const value = z.zx1 * point[0] + z.zx2 * point[1];

      if ((this.getProblemType() === "max" && value > bestValue) ||
        (this.getProblemType() === "min" && value < bestValue)) {
        bestValue = value;
        bestPoint = point;
      }
    }

    this.updateResults(result.pontos, bestPoint, bestValue);
    this.plotChart()
  }

  private updateResults(points: number[][], bestPoint: number[] | null, bestValue: number) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;

    const valueType = this.getProblemType() === "max" ? "Maximização" : "Minimização";
    resultDiv.innerHTML = `
      <h3>Pontos que satisfazem as condições: </h3>
      <p>${points.map(p => `(${p[0]}, ${p[1]})`).join(', ')}</p>

      <h3>Solução: </h3>
      <p>Ponto de ${valueType}: (${bestPoint ? bestPoint.join(', ') : 'N/A'})</p>
      <p>Valor de Z em ${valueType}: ${bestPoint ? bestValue.toFixed(2) : 'N/A'}</p>
    `;

    const tableResult = document.getElementById("tableResult");
    if (tableResult) {
      tableResult.style.display = "table";
    }
  }

  private cleanTable() {
    const bodyTable = document.querySelector("#tableResult tbody");
    if (bodyTable) {
      bodyTable.innerHTML = "";
    }
  }

  private addRow(x1: string, x2: string, result: string) {
    const table = document.getElementById("tableResult");
    if (!table) return;

    const tbody = table.getElementsByTagName('tbody')[0];
    const newRow = tbody.insertRow();
    newRow.className = result;

    const celX1 = newRow.insertCell(0);
    const celX2 = newRow.insertCell(1);
    const celResult = newRow.insertCell(2);

    celX1.innerText = x1;
    celX2.innerText = x2;
    celResult.innerText = result;
  }

  private plotChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const result = this.getConstraints();
    if (!result || result.pontos.length === 0) return;

    const z = this.getZFunction();
    if (!z) return;

    const orderedPoints = this.orderPolygonPoints(result.pontos);
    const areaData = orderedPoints.map(p => ({x: p[0], y: p[1]}));

    const lines = result.constraints.map(constraint => {
      const {x, y, rhs} = constraint;
      const data = [];
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      if (y !== 0) {
        for (let i = 0; i <= 20; i += 0.5) {
          const xVal = i;
          const yVal = (rhs - x * xVal) / y;
          if (yVal >= 0 && yVal <= 20) {
            data.push({x: xVal, y: yVal});
          }
        }
      } else {
        const xVal = rhs / x;
        if (xVal >= 0 && xVal <= 20) {
          data.push({x: xVal, y: 0});
          data.push({x: xVal, y: 20});
        }
      }

      return {
        label: `${x}x + ${y}y ≤ ${rhs}`,
        data,
        borderColor: randomColor,
        backgroundColor: 'transparent',
        showLine: true,
        pointRadius: 0,
        fill: false,
        order: 1
      };
    });

    const pointsDataset = result.pontos.map((ponto, index) => ({
      data: [{x: ponto[0], y: ponto[1]}],
      label: `Ponto ${index + 1} = (${ponto[0]}, ${ponto[1]})`,
      backgroundColor: 'rgb(0, 0, 0)',
      borderColor: 'rgb(0, 0, 0)',
      pointRadius: 6,
      showLine: false,
      order: 2,
      borderWidth: 2
    }));

    const ctx = document.getElementById('myChart') as HTMLCanvasElement;
    if (!ctx) return;

    let allX: number[] = [];
    let allY: number[] = [];

    lines.forEach(line => {
      line.data.forEach(point => {
        allX.push(point.x);
        allY.push(point.y);
      });
    });

    result.pontos.forEach(p => {
      allX.push(p[0]);
      allY.push(p[1]);
    });

    let maxX = Math.max(...allX);
    let maxY = Math.max(...allY);

    maxX = Math.ceil(maxX * 1.1);
    maxY = Math.ceil(maxY * 1.1);

    this.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          ...lines,
          ...pointsDataset,
        ]
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {display: true, text: 'x1'},
            min: -2,
            max: maxX
          },
          y: {
            min: -2,
            max: maxY,
            title: {display: true, text: 'x2'}
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  private orderPolygonPoints(points: number[][]): number[][] {
    const center = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0])
      .map(val => val / points.length);
    return points.sort((a, b) => {
      const angleA = Math.atan2(a[1] - center[1], a[0] - center[0]);
      const angleB = Math.atan2(b[1] - center[1], b[0] - center[0]);
      return angleA - angleB;
    });
  }
}
