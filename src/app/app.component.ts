import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MathComponent } from './math/math.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MathComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PL-app';
}
