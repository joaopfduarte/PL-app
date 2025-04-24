import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, FormArray, ReactiveFormsModule } from '@angular/forms';

interface TableRow {
  iteration: number;
  x1: number;
  x2: number;
  z: number;
  isOptimal: boolean;
}

@Component({
  selector: 'app-math',
  templateUrl: './math.component.html',
  styleUrl: './math.component.css',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MathComponent {
  mathForm: FormGroup;
  showResults = false;
  hasResults = false;
  resultHtml = '';
  tableData: TableRow[] = [];
  solution: { x1: number, x2: number, z: number } | null = null;

  constructor(private fb: FormBuilder) {
    this.mathForm = this.fb.group({
      objective: this.fb.group({
        coefX1: [''],
        coefX2: [''],
        type: ['max']
      }),
      constraints: this.fb.array([])
    });

    // Adiciona uma restrição inicial
    this.addConstraint();
  }

  get constraints() {
    return this.mathForm.get('constraints') as FormArray;
  }

  get objective() {
    return this.mathForm.get('objective') as FormGroup;
  }

  addConstraint() {
    const constraintForm = this.fb.group({
      coefX1: [''],
      coefX2: [''],
      operator: ['<='],
      constant: ['']
    });

    this.constraints.push(constraintForm);
  }

  removeConstraint(index: number) {
    if (this.constraints.length > 1) {
      this.constraints.removeAt(index);
    }
  }

  calculateSolution() {
    const formValue = this.mathForm.value;

    // Extrair dados do formulário
    const objective = {
      x1: parseFloat(formValue.objective.coefX1),
      x2: parseFloat(formValue.objective.coefX2),
      type: formValue.objective.type
    };

    const constraints = formValue.constraints.map((c: any) => ({
      x1: parseFloat(c.coefX1),
      x2: parseFloat(c.coefX2),
      operator: c.operator,
      constant: parseFloat(c.constant)
    }));

    // Implementar o método Simplex aqui
    this.solveSimplex(objective, constraints);
  }

  private solveSimplex(objective: any, constraints: any[]) {
    // Implementação do método Simplex
    // Este é um exemplo simplificado
    this.showResults = true;
    this.hasResults = true;

    // Exemplo de solução (você deve implementar a lógica real do Simplex)
    this.solution = {
      x1: 0,
      x2: 0,
      z: 0
    };

    // Exemplo de iterações
    this.tableData = [
      {
        iteration: 1,
        x1: this.solution.x1,
        x2: this.solution.x2,
        z: this.solution.z,
        isOptimal: true
      }
    ];

    // Gerar resultado em HTML
    this.generateResultHtml();
  }

  private generateResultHtml() {
    if (this.solution) {
      this.resultHtml = `
        <h3>Solução Ótima:</h3>
        <p>X1 = ${this.solution.x1}</p>
        <p>X2 = ${this.solution.x2}</p>
        <p>Z = ${this.solution.z}</p>
      `;
    }
  }

  resetForm() {
    this.mathForm.reset();
    this.showResults = false;
    this.hasResults = false;
    this.resultHtml = '';
    this.tableData = [];
    this.solution = null;

    // Reiniciar com uma restrição
    this.constraints.clear();
    this.addConstraint();
  }

  // Métodos auxiliares para validação
  isValidInput(): boolean {
    return this.mathForm.valid && this.constraints.length > 0;
  }
}
