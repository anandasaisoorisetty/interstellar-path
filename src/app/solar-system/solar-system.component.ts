import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-solar-system',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './solar-system.component.html',
  styleUrls: ['./solar-system.component.css']
})
export class SolarSystemComponent implements AfterViewInit {
  @ViewChild('solarCanvas') private solarCanvas!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private sun!: THREE.Mesh;
  private planets: {
    mesh: THREE.Mesh;
    distance: number;
    speed: number;
    radius: number;
    name: string;
    nameSprite?: THREE.Sprite;
    sizeSprite?: THREE.Sprite;
    orbit?: THREE.Line;
    moons: {
      mesh: THREE.Mesh;
      orbitRadius: number;
      speed: number;
      radius: number;
      orbit?: THREE.Line
    }[]
  }[] = [];
  private sunLight!: THREE.PointLight;
  showOrbits = true;
  showMoons = true;
  focusTarget = 'Solar System';
  isLoaded = false;
  progress = 0;
  isControlBoxVisible = false;
  private screenWidth: number = 0; // Track screen width

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth = window.innerWidth; // Initialize on construction
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit started');

    const duration = 7000;
    const interval = 100;
    const steps = duration / interval;
    let step = 0;

    const progressInterval = setInterval(() => {
      step++;
      this.progress = Math.round((step / steps) * 100);
      if (step >= steps) {
        clearInterval(progressInterval);
        this.isLoaded = true;

        if (isPlatformBrowser(this.platformId)) {
          this.initScene();
          this.createSolarSystem();
          this.addLighting();
          this.addStarfield();
          this.setupControls();
          this.animate();
        }
      }
    }, interval);
  }

  private initScene(): void {
    console.log('Initializing scene');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.solarCanvas.nativeElement });
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.camera.position.set(0, 25000, 75000);
  }

  private createSolarSystem(): void {
    console.log('Creating solar system');
    const textureLoader = new THREE.TextureLoader();
    const scaleFactor = 500;

    const sunGeometry = new THREE.SphereGeometry(5 * scaleFactor, 32, 32);
    const sunTexture = textureLoader.load('/sun_texture.jpg', () => console.log('Sun texture loaded'), undefined, (err) => console.error('Sun texture error:', err));
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture, color: 0xFFC107 });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);

    const planetData = [
      { name: 'Mercury', size: 0.0175 * scaleFactor, realSize: '4879', distance: 7500, speed: 0.001, texture: '/mercury_texture.jpg', moons: 0 },
      { name: 'Venus', size: 0.0435 * scaleFactor, realSize: '12104', distance: 10000, speed: 0.0008, texture: '/venus_texture.jpg', moons: 0 },
      { name: 'Earth', size: 0.0458 * scaleFactor, realSize: '12742', distance: 12500, speed: 0.0006, texture: '/earth_texture.jpg', moons: 1 },
      { name: 'Mars', size: 0.0244 * scaleFactor, realSize: '6792', distance: 15000, speed: 0.0005, texture: '/mars_texture.jpg', moons: 0 },
      { name: 'Jupiter', size: 0.502 * scaleFactor, realSize: '139820', distance: 25000, speed: 0.0003, texture: '/jupiter_texture.jpg', moons: 0 },
      { name: 'Saturn', size: 0.418 * scaleFactor, realSize: '116460', distance: 35000, speed: 0.0002, texture: '/saturn_texture.jpg', moons: 0 },
      { name: 'Uranus', size: 0.182 * scaleFactor, realSize: '50724', distance: 45000, speed: 0.00015, texture: '/uranus_texture.jpg', moons: 0 },
      { name: 'Neptune', size: 0.177 * scaleFactor, realSize: '49244', distance: 55000, speed: 0.0001, texture: '/neptune_texture.jpg', moons: 0 }
    ];

    planetData.forEach(data => {
      const geometry = new THREE.SphereGeometry(data.size, 64, 64);
      const texture = textureLoader.load(data.texture, () => console.log(`${data.name} texture loaded`), undefined, (err) => console.error(`${data.name} texture error:`, err));
      const material = new THREE.MeshPhongMaterial({ map: texture, shininess: 50 });
      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(data.distance, 0, 0);
      this.scene.add(planet);

      const orbitCurve = new THREE.EllipseCurve(0, 0, data.distance, data.distance, 0, 2 * Math.PI, false, 0);
      const points = orbitCurve.getPoints(100);
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 0.3, transparent: true });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      this.scene.add(orbit);

      const nameSprite = this.createNameSprite(data.name, data.size);
      this.scene.add(nameSprite);

      const sizeSprite = this.createSizeSprite(data.realSize, data.size);
      this.scene.add(sizeSprite);

      const moons = this.createMoons(data.moons, data.size, textureLoader, data.name === 'Earth');
      moons.forEach(moon => {
        this.scene.add(moon.mesh);
        if (moon.orbit) this.scene.add(moon.orbit);
        moon.mesh.visible = this.showMoons;
      });

      this.planets.push({ mesh: planet, distance: data.distance, speed: data.speed, radius: data.size, name: data.name, nameSprite, sizeSprite, orbit, moons });
    });

    const saturn = this.planets.find(p => p.name === 'Saturn')!.mesh;
    const ringGeometry = new THREE.RingGeometry(0.6 * scaleFactor, 1.2 * scaleFactor, 64);
    const ringTexture = textureLoader.load('/saturn_rings.png', () => console.log('Saturn rings loaded'), undefined, (err) => console.error('Saturn rings error:', err));
    const ringMaterial = new THREE.MeshBasicMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    saturn.add(rings);
  }

  private createNameSprite(name: string, size: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.fillText(name, 256, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2000, 500, 1);
    sprite.position.y = size * 1.5;
    return sprite;
  }

  private createSizeSprite(size: string, radius: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white';
    context.font = '36px Arial';
    context.textAlign = 'center';
    context.fillText(`${size} km`, 256, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1500, 375, 1);
    sprite.position.y = radius * 2;
    return sprite;
  }

  private createMoons(count: number, planetSize: number, textureLoader: THREE.TextureLoader, isEarth: boolean): { mesh: THREE.Mesh; orbitRadius: number; speed: number; radius: number; orbit?: THREE.Line }[] {
    const moons = [];
    if (count > 0) {
      const moonTexture = textureLoader.load('/moon_texture.jpg', () => console.log('Moon texture loaded'), undefined, (err) => console.error('Moon texture error:', err));
      for (let i = 0; i < count; i++) {
        const size = planetSize * 0.15;
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshPhongMaterial({ map: moonTexture, shininess: 50 });
        const moon = new THREE.Mesh(geometry, material);
        const orbitRadius = planetSize * 2;
        const speed = 0.002;

        let orbit: THREE.Line | undefined;
        if (isEarth) {
          const orbitCurve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius, 0, 2 * Math.PI, false, 0);
          const points = orbitCurve.getPoints(100);
          const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888, opacity: 0.3, transparent: true });
          orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        }

        moons.push({ mesh: moon, orbitRadius, speed, radius: size, orbit });
      }
    }
    return moons;
  }

  private addLighting(): void {
    console.log('Adding lighting');
    this.sunLight = new THREE.PointLight(0xFFC107, 5, 50000, 1.5);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  private addStarfield(): void {
    console.log('Adding starfield');
    const starGeometry = new THREE.SphereGeometry(25000, 32, 32);
    const starTexture = new THREE.TextureLoader().load('/starfield_texture.jpg', () => console.log('Starfield loaded'), undefined, (err) => console.error('Starfield error:', err));
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide, opacity: 0.5, transparent: true });
    const starfield = new THREE.Mesh(starGeometry, starMaterial);
    this.scene.add(starfield);
  }

  private setupControls(): void {
    console.log('Setting up controls');
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableRotate = true;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50000;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = false;
    this.controls.update();
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const time = Date.now() * 0.001;

    this.sun.rotation.y += 0.001;

    this.planets.forEach(planet => {
      planet.mesh.position.x = planet.distance * Math.cos(time * planet.speed);
      planet.mesh.position.z = planet.distance * Math.sin(time * planet.speed);
      planet.mesh.rotation.y += 0.02;

      if (planet.nameSprite) {
        planet.nameSprite.position.set(
          planet.mesh.position.x,
          planet.mesh.position.y + planet.radius * 1.5,
          planet.mesh.position.z
        );
      }

      if (planet.sizeSprite) {
        planet.sizeSprite.position.set(
          planet.mesh.position.x,
          planet.mesh.position.y + planet.radius * 2,
          planet.mesh.position.z
        );
      }

      planet.moons.forEach(moon => {
        moon.mesh.position.x = planet.mesh.position.x + moon.orbitRadius * Math.cos(time * moon.speed);
        moon.mesh.position.z = planet.mesh.position.z + moon.orbitRadius * Math.sin(time * moon.speed);
        moon.mesh.rotation.y += 0.02;

        if (moon.orbit) {
          moon.orbit.position.set(planet.mesh.position.x, 0, planet.mesh.position.z);
        }
      });

      if (this.focusTarget === planet.name) {
        this.controls.target.copy(planet.mesh.position);
        this.camera.lookAt(planet.mesh.position);
      } else if (this.focusTarget === 'Moon' && planet.name === 'Earth' && planet.moons.length > 0) {
        const moon = planet.moons[0];
        this.controls.target.copy(moon.mesh.position);
        this.camera.lookAt(moon.mesh.position);
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  toggleOrbits(): void {
    console.log('Toggling orbits:', this.showOrbits);
    this.planets.forEach(planet => {
      if (planet.orbit) planet.orbit.visible = this.showOrbits;
      planet.moons.forEach(moon => {
        if (moon.orbit) moon.orbit.visible = this.showOrbits && this.showMoons;
      });
    });
  }

  toggleMoons(): void {
    console.log('Toggling moons:', this.showMoons);
    this.planets.forEach(planet => {
      planet.moons.forEach(moon => {
        moon.mesh.visible = this.showMoons;
        if (moon.orbit) moon.orbit.visible = this.showMoons && this.showOrbits;
      });
    });
  }

  focusOnTarget(): void {
    console.log('Focusing on:', this.focusTarget);
    this.planets.forEach(planet => {
      if (planet.nameSprite) planet.nameSprite.visible = true;
      if (planet.sizeSprite) planet.sizeSprite.visible = true;
    });

    if (this.focusTarget === 'Solar System') {
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 75000, 150000);
      console.log('Set to Solar System view');
    } else if (this.focusTarget === 'Sun') {
      this.controls.target.copy(this.sun.position);
      this.camera.position.set(this.sun.position.x, this.sun.position.y + 2500, this.sun.position.z + 3750);
      console.log('Set to Sun view');
    } else if (this.focusTarget === 'Moon') {
      const earth = this.planets.find(p => p.name === 'Earth');
      if (earth && earth.moons.length > 0) {
        const moon = earth.moons[0];
        this.controls.target.copy(moon.mesh.position);
        this.camera.position.set(moon.mesh.position.x, moon.mesh.position.y + moon.radius * 2, moon.mesh.position.z + moon.radius * 5);
        if (earth.nameSprite) earth.nameSprite.visible = false;
        if (earth.sizeSprite) earth.sizeSprite.visible = false;
        console.log('Set to Moon view');
      }
    } else {
      const planet = this.planets.find(p => p.name === this.focusTarget);
      if (planet) {
        this.controls.target.copy(planet.mesh.position);
        this.camera.position.set(planet.mesh.position.x, planet.mesh.position.y + planet.radius * 2, planet.mesh.position.z + planet.radius * 5);
        if (planet.nameSprite) planet.nameSprite.visible = false;
        if (planet.sizeSprite) planet.sizeSprite.visible = false;
        console.log('New camera position:', this.camera.position);
      } else {
        console.error('Planet not found:', this.focusTarget);
      }
    }
    this.controls.update();
  }

  toggleControlBox(): void {
    this.isControlBoxVisible = !this.isControlBoxVisible;
    console.log('Control box toggled:', this.isControlBoxVisible);
  }

  isDesktop(): boolean {
    return this.screenWidth > 768;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth = window.innerWidth; // Update screen width on resize
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
  }
}
