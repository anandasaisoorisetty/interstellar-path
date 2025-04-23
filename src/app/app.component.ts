import { Component, OnInit } from '@angular/core';
import { SolarSystemComponent } from './solar-system/solar-system.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SolarSystemComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'solar-system';
  deferredPrompt: any;

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
    });
  }

  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      this.deferredPrompt = null;
    }
  }
}


