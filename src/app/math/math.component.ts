import {Component} from '@angular/core';
import {FormGroup, FormBuilder, FormArray, ReactiveFormsModule, Validators} from '@angular/forms';
import {GraphComponent} from '../graph/graph.component';
import {CommonModule} from '@angular/common';

interface Constraint {
  coefX1: string;
  coefX2: string;
  operator: string;
  constant: string;
}

@Component({
  selector: 'app-math',
  templateUrl: './math.component.html',
  styleUrls: ['./math.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GraphComponent]
})
export class MathComponent {
  mathForm: FormGroup;
  resultHtml = '';
  tableData: any[] = [];
  solution: { x1: number, x2: number, z: number } | null = null;
  hasResults: boolean = false;
  showResults: boolean = false;
  showTable: boolean = false;
  showGraph: boolean = false;
  showForm: boolean = true;
  showReset: boolean = false;
  showCalculate: boolean = false;
  showAddConstraint: boolean = false;
  showRemoveConstraint: boolean = false;
  showSolution: boolean = false;
  showTableHeader: boolean = false;

  constructor(private fb: FormBuilder) {
    this.mathForm = this.fb.group({
      problemType: ['max', Validators.required],
      objective: this.fb.group({
        zx1: ['', Validators.required],
        zx2: ['', Validators.required]
      }),
      constraints: this.fb.array([])
    });

    this.addConstraint();
  }

  get constraints() {
    return this.mathForm.get('constraints') as FormArray;
  }

  get objective() {
    return this.mathForm.get('objective') as FormGroup;
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

  calculateSolution() {
    this.cleanTable();
    if (!this.mathForm.valid) {
      alert('Por favor, preencha todos os campos!');
      return;
    }


    const formValue = this.mathForm.value;

    const objective = {
      zx1: parseFloat(formValue.objective.zx1),
      zx2: parseFloat(formValue.objective.zx2),
      type: formValue.problemType.toLowerCase()
    };

    const constraints = this.getConstraints();
    if (!constraints) return;

    const points = this.findIntersectionPoints(constraints);

    if (points) {
      const uniquePoints = Array.from(
        new Set(points.map(point => JSON.stringify(point)))
      ).map(point => JSON.parse(point));

      const result = this.getOptimalSolution(objective, uniquePoints);
      const valueType = objective.type === 'max' ? 'Maximização' : 'Minimização';

      this.solution = result.bestPoint ? {
        x1: result.bestPoint[0],
        x2: result.bestPoint[1],
        z: result.bestValue
      } : null;


      this.generateTableData(objective, uniquePoints);


      this.resultHtml = `
        <h3>Pontos que satisfazem as condições:</h3>
        <p>${uniquePoints.map(p => `(${p[0]}, ${p[1]})`).join(', ')}</p>
        <h3>Solução:</h3>
        <p>Ponto de ${valueType}: (${this.solution ? this.solution.x1.toFixed(2) + ', ' + this.solution.x2.toFixed(2) : 'N/A'})</p>
        <p>Valor de Z em ${valueType}: ${this.solution ? this.solution.z.toFixed(2) : 'N/A'}</p>
      `;
    }

    const resultSection = document.querySelector('.results-section');
    if (resultSection) {
      resultSection.scrollIntoView({behavior: 'smooth'});
    }

  }

  resetForm() {
    this.mathForm.reset();
    this.constraints.clear();
    this.addConstraint();
    this.resultHtml = '';
    this.tableData = [];
    this.solution = null;
  }

  private findIntersectionPoints(constraints: any[]) {
    const equations = this.convertConstraintsIntoEquations(constraints);
    const allConstraints = [...constraints,
      {x: 1, y: 0, type: '>=', rhs: 0},
      {x: 0, y: 1, type: '>=', rhs: 0}
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

        points.push([Number(x.toFixed(2)), Number(y.toFixed(2))]);
      }
    }

    return points.filter(point =>
      !(point[0] < 0 || point[1] < 0) &&
      allConstraints.every(c => {
        const value = c.x * point[0] + c.y * point[1];
        return c.type === '<=' ? value <= c.rhs : value >= c.rhs;
      })
    );
  }

  private convertConstraintsIntoEquations(constraints: any[]) {
    return constraints.map(c => ({
      a: c.x,
      b: c.y,
      c: c.rhs
    }));
  }

  private getOptimalSolution(objective: any, points: any[]) {
    let bestPoint = null;
    let bestValue = objective.type === 'max' ? -Infinity : Infinity;

    for (const point of points) {
      const value = objective.zx1 * point[0] + objective.zx2 * point[1];
      if (
        (objective.type === 'max' && value > bestValue) ||
        (objective.type === 'min' && value < bestValue)
      ) {
        bestValue = value;
        bestPoint = point;
      }
    }

    return {bestPoint, bestValue};
  }

  private generateTableData(objective: any, points: any[]) {
    this.tableData = points.map((point, index) => ({
      iteration: index + 1,
      x1: point[0],
      x2: point[1],
      z: objective.zx1 * point[0] + objective.zx2 * point[1],
      isOptimal: this.solution
        ? (point[0] === this.solution.x1 && point[1] === this.solution.x2)
        : false
    }));
  }

  getConstraints(): { x: number; y: number; type: string; rhs: number }[] | null {

    const constraints = this.mathForm.get('constraints')?.value.map((c: Constraint) => ({
      x: parseFloat(c.coefX1),
      y: parseFloat(c.coefX2),
      type: c.operator,
      rhs: parseFloat(c.constant)
    }));


    if (!constraints || constraints.some((c: { x: number; y: number; rhs: number }) =>
      isNaN(c.x) || isNaN(c.y) || isNaN(c.rhs))) {
      alert('Preencha todos os campos das restrições corretamente!');
      return null;
    }

    return constraints;
  }

  cleanTable() {
    this.tableData = [];
  }

  private getZFunction(): { zx1: number; zx2: number } | null {
    const zx1 = parseFloat(this.mathForm.get('objective.zx1')?.value);
    const zx2 = parseFloat(this.mathForm.get('objective.zx2')?.value);

    if (isNaN(zx1) || isNaN(zx2)) {
      alert('Função Z inválida! Certifique-se de preencher ambos os coeficientes.');
      return null;
    }

    return {zx1, zx2};
  }
}
