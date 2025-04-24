import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, FormArray, ReactiveFormsModule } from '@angular/forms';

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
  tableData: any[] = [];

  constructor(private fb: FormBuilder) {
    this.mathForm = this.fb.group({
      constraints: this.fb.array([])
    });
    // Adiciona uma restrição inicial
    this.addConstraint();
  }

  get constraints() {
    return this.mathForm.get('constraints') as FormArray;
  }

  // Método que estava faltando
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
    this.constraints.removeAt(index);
  }

  calculateSolution() {
    // Implementação do seu método
    this.showResults = true;
    // ... resto da lógica
  }

  // ... outros métodos existentes
}
