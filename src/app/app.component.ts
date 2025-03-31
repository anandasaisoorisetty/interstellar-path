import { Component } from '@angular/core';
import { SolarSystemComponent } from './solar-system/solar-system.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SolarSystemComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'solar-system';
}


