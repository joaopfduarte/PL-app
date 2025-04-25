import {Component} from '@angular/core';
import {FormGroup, FormBuilder, FormArray, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-math',
  templateUrl: './math.component.html',
  styleUrls: ['./math.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class MathComponent {
  mathForm: FormGroup;
  resultHtml = '';
  tableData: any[] = [];
  solution: { x1: number, x2: number, z: number } | null = null;

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
    if (!this.mathForm.valid) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    const formValue = this.mathForm.value;

    const objective = {
      zx1: parseFloat(formValue.objective.zx1),
      zx2: parseFloat(formValue.objective.zx2),
      type: formValue.objective.type.toLowerCase()
    };

    const constraints = formValue.constraints.map((c: any) => ({
      x: parseFloat(c.coefX1),
      y: parseFloat(c.coefX2),
      type: c.operator,
      rhs: parseFloat(c.constant)
    }));

    const points = this.findIntersectionPoints(constraints);
    const myArray = ["1", "2", "3"];
    const parsedArray = myArray.map(element => {
      try {
        return JSON.parse(element);
      } catch (e) {
        console.error(`Erro ao parsear elemento: ${element}`, e);
        return null;
      }
    }).filter(value => value !== null);
    console.log(parsedArray);

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

      this.resultHtml = `
        <h3>Pontos que satisfazem as condições:</h3>
        <p>${uniquePoints.map(p => `(${p[0]}, ${p[1]})`).join(', ')}</p>
        <h3>Solução:</h3>
        <p>Ponto de ${valueType}: (${this.solution ? this.solution.x1.toFixed(2) + ', ' + this.solution.x2.toFixed(2) : 'N/A'})</p>
        <p>Valor de Z em ${valueType}: ${this.solution ? this.solution.z.toFixed(2) : 'N/A'}</p>
      `;

      this.generateTableData(objective, uniquePoints);
    }
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
      !(point[0] === 0 && point[1] === 0) &&
      allConstraints.every(c => {
        const value = c.x * point[0] + c.y * point[1];
        return c.type === '<=' ? value <= c.rhs :
          c.type === '>=' ? value >= c.rhs : false;
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
      z: objective.zx1 * point[0] + objective.zx2 * point[1]
    }));
  }

  resetForm() {
    this.mathForm.reset();
    this.constraints.clear();
    this.addConstraint();
    this.resultHtml = '';
    this.tableData = [];
    this.solution = null;
  }
}
