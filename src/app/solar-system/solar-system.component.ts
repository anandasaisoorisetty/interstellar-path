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
  @ViewChild('infoBox') private infoBox!: ElementRef<HTMLDivElement>;

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
    orbitContainer?: THREE.Object3D;
    moons: {
      mesh: THREE.Mesh;
      orbitRadius: number;
      speed: number;
      radius: number;
      orbit?: THREE.Line
    }[];
    rings?: THREE.Mesh;
  }[] = [];
  private sunLight!: THREE.PointLight;
  showOrbits = true;
  showMoons = true;
  focusTarget = 'Interstellar Path';
  isLoaded = false;
  progress = 0;
  isControlBoxVisible = false;
  isInfoBoxVisible = false;
  selectedTargetDetails: any = null;
  private screenWidth: number = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private infoBoxX = 0;
  private infoBoxY = 0;
  isCalendarVisible = false;
  private calendarCard: HTMLElement | null = null;
  isQuoteVisible = false;

  private targetDetails: { [key: string]: any } = {
    'Sun': {
      general: {
        name: 'Sun',
        type: 'Star',
        classification: 'G-type main-sequence star (G2V)',
        sanskritName: 'सूर्य (Surya)',
        teluguName: 'సూర్యుడు (Suryudu)',
        significance: 'The Sun is considered the king of planets in Vedic astrology. It represents the soul, self, authority, and leadership.',
        benefits: 'Worship of Surya brings health, vitality, success, and removes obstacles. It enhances confidence and leadership qualities.',
        uses: 'Used in determining auspicious timings, career success, and health predictions.',
        shloka: {
          sanskrit: 'जपाकुसुमसंकाशं काश्यपेयं महाद्युतिम्।\nतमोरिं सर्वपापघ्नं प्रणतोस्मि दिवाकरम्॥',
          telugu: 'జపాకుసుమసంకాశం కాశ్యపేయం మహాద్యుతిమ్।\nతమోరిం సర్వపాపఘ్నం ప్రణతోస్మి దివాకరమ్॥',
          english: 'I bow to the Sun God, who is as radiant as the hibiscus flower,\nWho is the son of Kashyapa, who dispels darkness and destroys all sins.'
        }
      },
      physical: { diameter: '1,391,000 km', mass: '1.989 × 10³⁰ kg', volume: '1.41 × 10¹⁸ km³', density: '1.41 g/cm³', surfaceGravity: '274 m/s²' },
      orbital: { distanceFromSun: '0 km', distanceFromEarth: '~149.6 million km (1 AU)', orbitalPeriod: 'N/A', rotationPeriod: '~25 days (equator), ~35 days (poles)', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Hydrogen, Helium', atmosphericPressure: 'N/A' },
      temperature: { average: '~5,500°C (Photosphere)', minimum: 'N/A', maximum: '~15 million°C (Core)' },
      other: { numberOfMoons: '0', rings: 'No', magneticField: 'Yes', notableFeatures: 'Solar Flares, Sunspots, Corona' }
    },
    'Moon': {
      general: {
        name: 'Moon',
        type: 'Natural Satellite',
        classification: 'Natural Satellite',
        sanskritName: 'चंद्र (Chandra)',
        teluguName: 'చంద్రుడు (Chandrudu)',
        significance: 'The Moon represents the mind, emotions, and motherly qualities in Vedic astrology.',
        benefits: 'Worship of Chandra brings mental peace, emotional stability, and success in creative pursuits.',
        uses: 'Used in determining emotional states, mental health, and timing of events.',
        shloka: {
          sanskrit: 'दधिशंखतुषाराभं क्षीरोदार्णवसंभवम्।\nनमामि शशिनं सोमं शंभोर्मुकुटभूषणम्॥',
          telugu: 'దధిశంఖతుషారాభం క్షీరోదార్ణవసంభవమ్।\nనమామి శశినం సోమం శంభోర్ముకుటభూషణమ్॥',
          english: 'I bow to the Moon, who is as white as curd, conch shell, and snow,\nWho was born from the ocean of milk, and who adorns Lord Shiva\'s crown.'
        }
      },
      physical: { diameter: '3,474 km', mass: '7.35 × 10²² kg', volume: '2.2 × 10¹⁰ km³', density: '3.34 g/cm³', surfaceGravity: '1.62 m/s²' },
      orbital: { distanceFromSun: '~149.6 million km (via Earth)', distanceFromEarth: '~384,400 km', orbitalPeriod: '27.3 days', rotationPeriod: '27.3 days (Synchronous)', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Very thin (Exosphere)', atmosphericPressure: 'Negligible' },
      temperature: { average: 'N/A', minimum: '-173°C', maximum: '127°C' },
      other: { numberOfMoons: 'N/A', rings: 'No', magneticField: 'No', notableFeatures: 'Craters, Maria, Highlands' }
    },
    'Mercury': {
      general: {
        name: 'Mercury',
        type: 'Planet',
        classification: 'Terrestrial',
        sanskritName: 'बुध (Budha)',
        teluguName: 'బుధుడు (Budhudu)',
        significance: 'Mercury represents intelligence, communication, and analytical abilities in Vedic astrology.',
        benefits: 'Worship of Budha enhances intellect, communication skills, and business acumen.',
        uses: 'Used in determining educational success, business prospects, and communication abilities.',
        shloka: {
          sanskrit: 'प्रियंगुकलिकाश्यामं रूपेणाप्रतिमं बुधम्।\nसौम्यं सौम्यगुणोपेतं तं बुधं प्रणमाम्यहम्॥',
          telugu: 'ప్రియంగుకలికాశ్యామం రూపేణాప్రతిమం బుధమ్।\nసౌమ్యం సౌమ్యగుణోపేతం తం బుధం ప్రణమామ్యహమ్॥',
          english: 'I bow to Mercury, who is dark like the bud of Priyangu flower,\nWho is incomparable in beauty, gentle, and endowed with auspicious qualities.'
        }
      },
      physical: { diameter: '4,880 km', mass: '3.3 × 10²³ kg', volume: 'N/A', density: '5.43 g/cm³', surfaceGravity: '3.7 m/s²' },
      orbital: { distanceFromSun: '~57.9 million km (0.39 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '88 days', rotationPeriod: '59 days', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Very thin (Oxygen, Sodium, Hydrogen)', atmosphericPressure: 'Negligible' },
      temperature: { average: 'N/A', minimum: '-173°C', maximum: '427°C' },
      other: { numberOfMoons: '0', rings: 'No', magneticField: 'Weak', notableFeatures: 'Large Impact Craters, Cliffs' }
    },
    'Venus': {
      general: {
        name: 'Venus',
        type: 'Planet',
        classification: 'Terrestrial',
        sanskritName: 'शुक्र (Shukra)',
        teluguName: 'శుక్రుడు (Shukrudu)',
        significance: 'Venus represents love, beauty, luxury, and artistic abilities in Vedic astrology.',
        benefits: 'Worship of Shukra brings marital happiness, artistic success, and material comforts.',
        uses: 'Used in determining marriage compatibility, artistic talents, and financial prosperity.',
        shloka: {
          sanskrit: 'हिमकुन्दमृणालाभं दैत्यानां परमं गुरुम्।\nसर्वशास्त्रप्रवक्तारं भार्गवं प्रणमाम्यहम्॥',
          telugu: 'హిమకుందమృణాలాభం దైత్యానాం పరమం గురుమ్।\nసర్వశాస్త్రప్రవక్తారం భార్గవం ప్రణమామ్యహమ్॥',
          english: 'I bow to Venus, who is as white as snow, lotus stalk, and moon,\nWho is the supreme preceptor of demons and the teacher of all scriptures.'
        }
      },
      physical: { diameter: '12,104 km', mass: '4.87 × 10²⁴ kg', volume: 'N/A', density: '5.24 g/cm³', surfaceGravity: '8.87 m/s²' },
      orbital: { distanceFromSun: '~108.2 million km (0.72 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '225 days', rotationPeriod: '243 days (Retrograde)', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Thick (Carbon Dioxide, Nitrogen)', atmosphericPressure: 'N/A' },
      temperature: { average: '~462°C', minimum: 'N/A', maximum: 'N/A' },
      other: { numberOfMoons: '0', rings: 'No', magneticField: 'No', notableFeatures: 'Volcanic Plains, Thick Clouds of Sulfuric Acid' }
    },
    'Earth': {
      general: {
        name: 'Earth',
        type: 'Planet',
        classification: 'Terrestrial',
        sanskritName: 'पृथ्वी (Prithvi)',
        teluguName: 'భూమి (Bhoomi)',
        significance: 'Earth represents stability, nourishment, and material existence in Vedic cosmology.',
        benefits: 'Worship of Prithvi brings stability, prosperity, and connection with nature.',
        uses: 'Used in determining material success, agricultural prospects, and environmental harmony.',
        shloka: {
          sanskrit: 'समुद्रवसने देवि पर्वतस्तनमण्डले।\nविष्णुपत्नि नमस्तुभ्यं पादस्पर्शं क्षमस्व मे॥',
          telugu: 'సముద్రవసనే దేవి పర్వతస్తనమండలే।\nవిష్ణుపత్ని నమస్తుభ్యం పాదస్పర్శం క్షమస్వ మే॥',
          english: 'O Goddess Earth, who wears the ocean as her garment,\nWhose bosom is adorned with mountains, consort of Lord Vishnu,\nI bow to you, please forgive my touch with my feet.'
        }
      },
      physical: { diameter: '12,742 km', mass: '5.97 × 10²⁴ kg', volume: 'N/A', density: '5.51 g/cm³', surfaceGravity: '9.8 m/s²' },
      orbital: { distanceFromSun: '~149.6 million km (1 AU)', distanceFromEarth: '0 km', orbitalPeriod: '365.25 days', rotationPeriod: '24 hours', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Nitrogen, Oxygen, Argon', atmosphericPressure: '1 bar' },
      temperature: { average: '~15°C', minimum: '-88°C', maximum: '58°C' },
      other: { numberOfMoons: '1', rings: 'No', magneticField: 'Yes', notableFeatures: 'Liquid Water, Magnetic Field, Life' }
    },
    'Mars': {
      general: {
        name: 'Mars',
        type: 'Planet',
        classification: 'Terrestrial',
        sanskritName: 'मंगल (Mangala)',
        teluguName: 'అంగారకుడు (Angarakudu)',
        significance: 'Mars represents energy, courage, and physical strength in Vedic astrology.',
        benefits: 'Worship of Mangala brings courage, physical strength, and success in competitive fields.',
        uses: 'Used in determining physical strength, military success, and competitive abilities.',
        shloka: {
          sanskrit: 'धरणीगर्भसंभूतं विद्युत्कान्तिसमप्रभम्।\nकुमारं शक्तिहस्तं तं मंगलं प्रणमाम्यहम्॥',
          telugu: 'ధరణీగర్భసంభూతం విద్యుత్కాంతిసమప్రభమ్।\nకుమారం శక్తిహస్తం తం మంగళం ప్రణమామ్యహమ్॥',
          english: 'I bow to Mars, who was born from the womb of Earth,\nWho shines like lightning, who is youthful and holds a spear in his hand.'
        }
      },
      physical: { diameter: '6,779 km', mass: '6.42 × 10²³ kg', volume: 'N/A', density: '3.93 g/cm³', surfaceGravity: '3.71 m/s²' },
      orbital: { distanceFromSun: '~227.9 million km (1.52 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '687 days', rotationPeriod: '24.6 hours', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Thin (Carbon Dioxide, Nitrogen, Argon)', atmosphericPressure: 'N/A' },
      temperature: { average: 'N/A', minimum: '-140°C', maximum: '30°C' },
      other: { numberOfMoons: '2 (Phobos, Deimos)', rings: 'No', magneticField: 'No', notableFeatures: 'Olympus Mons, Valles Marineris' }
    },
    'Jupiter': {
      general: {
        name: 'Jupiter',
        type: 'Planet',
        classification: 'Gas Giant',
        sanskritName: 'बृहस्पति (Brihaspati)',
        teluguName: 'బృహస్పతి (Brihaspati)',
        significance: 'Jupiter represents wisdom, knowledge, and spiritual growth in Vedic astrology.',
        benefits: 'Worship of Brihaspati brings wisdom, knowledge, and spiritual enlightenment.',
        uses: 'Used in determining educational success, spiritual growth, and wisdom.',
        shloka: {
          sanskrit: 'देवानां च ऋषीणां च गुरुं कांचनसन्निभम्।\nबुद्धिभूतं त्रिलोकेशं तं नमामि बृहस्पतिम्॥',
          telugu: 'దేవానాం చ ఋషీణాం చ గురుం కాంచనసన్నిభమ్।\nబుద్ధిభూతం త్రిలోకేశం తం నమామి బృహస్పతిమ్॥',
          english: 'I bow to Brihaspati, who is the teacher of gods and sages,\nWho is golden in color, who is the embodiment of wisdom and the lord of the three worlds.'
        }
      },
      physical: { diameter: '139,820 km', mass: '1.9 × 10²⁷ kg', volume: 'N/A', density: '1.33 g/cm³', surfaceGravity: '24.79 m/s²' },
      orbital: { distanceFromSun: '~778.3 million km (5.2 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '11.86 years', rotationPeriod: '9.9 hours', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Hydrogen, Helium', atmosphericPressure: 'N/A' },
      temperature: { average: '-108°C', minimum: 'N/A', maximum: 'N/A' },
      other: { numberOfMoons: '95+ (Io, Europa, Ganymede, Callisto)', rings: 'Yes (Faint)', magneticField: 'Yes (Strongest)', notableFeatures: 'Great Red Spot' }
    },
    'Saturn': {
      general: {
        name: 'Saturn',
        type: 'Planet',
        classification: 'Gas Giant',
        sanskritName: 'शनि (Shani)',
        teluguName: 'శని (Shani)',
        significance: 'Saturn represents discipline, hard work, and life lessons in Vedic astrology.',
        benefits: 'Worship of Shani brings discipline, patience, and success through hard work.',
        uses: 'Used in determining life challenges, career growth, and karmic lessons.',
        shloka: {
          sanskrit: 'नीलांजनसमाभासं रविपुत्रं यमाग्रजम्।\nछायामार्तण्डसंभूतं तं नमामि शनैश्चरम्॥',
          telugu: 'నీలాంజనసమాభాసం రవిపుత్రం యమాగ్రజమ్।\nఛాయామార్తండసంభూతం తం నమామి శనైశ్చరమ్॥',
          english: 'I bow to Saturn, who is as dark as collyrium,\nWho is the son of Sun and elder brother of Yama,\nWho was born from the shadow of the Sun.'
        }
      },
      physical: { diameter: '116,460 km', mass: '5.68 × 10²⁶ kg', volume: 'N/A', density: '0.69 g/cm³', surfaceGravity: '10.44 m/s²' },
      orbital: { distanceFromSun: '~1.43 billion km (9.5 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '29.5 years', rotationPeriod: '10.7 hours', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Hydrogen, Helium', atmosphericPressure: 'N/A' },
      temperature: { average: '-139°C', minimum: 'N/A', maximum: 'N/A' },
      other: { numberOfMoons: '146+ (Titan, Enceladus)', rings: 'Yes (Largest)', magneticField: 'Yes', notableFeatures: 'Largest Ring System' }
    },
    'Uranus': {
      general: {
        name: 'Uranus',
        type: 'Planet',
        classification: 'Ice Giant',
        sanskritName: 'अरुण (Aruna)',
        teluguName: 'అరుణుడు (Arunudu)',
        significance: 'Uranus represents innovation, sudden changes, and unconventional thinking in modern astrology.',
        benefits: 'Worship of Aruna brings innovation, creativity, and progressive thinking.',
        uses: 'Used in determining innovative abilities, technological success, and unconventional paths.',
        shloka: {
          sanskrit: 'अरुणं करुणावर्णं तपन्तं कमलासनम्।\nगुह्यकाधिपतिं वन्दे भास्करप्रियमंशुमत्॥',
          telugu: 'అరుణం కరుణావర్ణం తపంతం కమలాసనమ్।\nగుహ్యకాధిపతిం వందే భాస్కరప్రియమంశుమత్॥',
          english: 'I bow to Aruna, who is of compassionate color,\nWho shines and sits on a lotus, who is the lord of Guhyakas,\nWho is dear to the Sun and radiant.'
        }
      },
      physical: { diameter: '50,724 km', mass: '8.68 × 10²⁵ kg', volume: 'N/A', density: '1.27 g/cm³', surfaceGravity: '8.69 m/s²' },
      orbital: { distanceFromSun: '~2.87 billion km (19.2 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '84 years', rotationPeriod: '17.2 hours (Tilted at 98°)', axialTilt: '98°', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Hydrogen, Helium, Methane', atmosphericPressure: 'N/A' },
      temperature: { average: '-224°C', minimum: 'N/A', maximum: 'N/A' },
      other: { numberOfMoons: '27+ (Miranda, Titania)', rings: 'Yes (Faint)', magneticField: 'Yes', notableFeatures: 'Rotates on its Side' }
    },
    'Neptune': {
      general: {
        name: 'Neptune',
        type: 'Planet',
        classification: 'Ice Giant',
        sanskritName: 'वरुण (Varuna)',
        teluguName: 'వరుణుడు (Varunudu)',
        significance: 'Neptune represents intuition, spirituality, and the subconscious in modern astrology.',
        benefits: 'Worship of Varuna brings spiritual insight, intuition, and connection with the divine.',
        uses: 'Used in determining spiritual growth, intuitive abilities, and artistic inspiration.',
        shloka: {
          sanskrit: 'वरुणं पाशहस्तं च श्वेतवर्णं चतुर्भुजम्।\nप्रलयाम्बुनिधिं वन्दे सर्वलोकैकनायकम्॥',
          telugu: 'వరుణం పాశహస్తం చ శ్వేతవర్ణం చతుర్భుజమ్।\nప్రలయాంబునిధిం వందే సర్వలోకైకనాయకమ్॥',
          english: 'I bow to Varuna, who holds a noose in his hand,\nWho is white in color and has four arms,\nWho is the ocean of dissolution and the sole lord of all worlds.'
        }
      },
      physical: { diameter: '49,244 km', mass: '1.02 × 10²⁶ kg', volume: 'N/A', density: '1.64 g/cm³', surfaceGravity: '11.15 m/s²' },
      orbital: { distanceFromSun: '~4.5 billion km (30.1 AU)', distanceFromEarth: 'N/A', orbitalPeriod: '165 years', rotationPeriod: '16 hours', axialTilt: 'N/A', orbitalInclination: 'N/A', eccentricity: 'N/A' },
      atmosphere: { mainGases: 'Hydrogen, Helium, Methane', atmosphericPressure: 'N/A' },
      temperature: { average: '-214°C', minimum: 'N/A', maximum: 'N/A' },
      other: { numberOfMoons: '14+ (Triton)', rings: 'Yes (Faint)', magneticField: 'Yes', notableFeatures: 'Fastest Winds (2,100 km/h), Great Dark Spot' }
    }
  };

  // Calendar data
  currentDate = new Date();
  suryaSiddhantaDate = this.calculateSuryaSiddhantaDate();
  ugadiDate = this.calculateUgadiDate();

  private calculateSuryaSiddhantaDate(): any {
    // Surya Siddhanta date calculation based on Kali Yuga
    const kaliYugaStart = 3102; // BCE
    const currentYear = this.currentDate.getFullYear();
    const suryaSiddhantaYear = currentYear + kaliYugaStart;

    return {
      year: suryaSiddhantaYear,
      tithi: 'Shukla Paksha Pratipada',
      nakshatra: 'Ashwini'
    };
  }

  private calculateUgadiDate(): any {
    // Ugadi calendar details
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const vaaram = ['Bhanuvaasara', 'Sowmyavaasara', 'Mangalavaasara', 'Budhavaasara', 'Guruvaasara', 'Shukravaasara', 'Shanivaasara'];
    const currentDay = this.currentDate.getDay();

    // Calculate Rahu Time (1.5 hours before sunset)
    const sunset = new Date(this.currentDate);
    sunset.setHours(18, 0, 0); // Assuming sunset at 6 PM
    const rahuStart = new Date(sunset);
    rahuStart.setHours(sunset.getHours() - 1, sunset.getMinutes() - 30);
    const rahuEnd = new Date(sunset);
    rahuEnd.setHours(sunset.getHours() - 1);

    return {
      year: 'Kali Yuga 5126',
      yearName: 'Sri Viswavasu',
      vaaram: vaaram[currentDay],
      vaaramEnglish: days[currentDay],
      tithi: 'Dashami till 4:43 PM, then Ekadashi',
      paksha: 'Krishna Paksham',
      masa: 'Chaitra Masam',
      nakshatra: 'Dhanishta till 12:07 PM, then Shatabhisha',
      rahuTime: `${rahuStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} to ${rahuEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    };
  }

  private calculateTithi(): string {
    return 'Shukla Paksha Pratipada';
  }

  private calculateNakshatra(): string {
    return 'Ashwini';
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth = window.innerWidth;
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit started');
    this.calendarCard = document.querySelector('.calendar-card');

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
          this.setupDragHandlers();
        }
      }
    }, interval);
  }

  private initScene(): void {
    console.log('Initializing scene');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.solarCanvas.nativeElement });
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    // Set initial camera position to show the entire solar system
    this.camera.position.set(0, 200000, 400000);
  }

  private createSolarSystem(): void {
    console.log('Creating solar system');
    const textureLoader = new THREE.TextureLoader();
    const scaleFactor = 1000;

    const sunGeometry = new THREE.SphereGeometry(5 * scaleFactor, 32, 32);
    const sunTexture = textureLoader.load('/assets/sun_texture.jpg');
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture, color: 0xFFC107 });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);

    const planetData = [
      { name: 'Mercury', size: 0.07 * scaleFactor, realSize: '4879', distance: 15000, speed: 0.001, texture: '/assets/mercury_texture.jpg', moons: 0 },
      { name: 'Venus', size: 0.174 * scaleFactor, realSize: '12104', distance: 20000, speed: 0.0008, texture: '/assets/venus_texture.jpg', moons: 0 },
      { name: 'Earth', size: 0.1832 * scaleFactor, realSize: '12742', distance: 25000, speed: 0.0006, texture: '/assets/earth_texture.jpg', moons: 1 },
      { name: 'Mars', size: 0.0976 * scaleFactor, realSize: '6792', distance: 30000, speed: 0.0005, texture: '/assets/mars_texture.jpg', moons: 0 },
      { name: 'Jupiter', size: 2.008 * scaleFactor, realSize: '139820', distance: 50000, speed: 0.0003, texture: '/assets/jupiter_texture.jpg', moons: 0 },
      { name: 'Saturn', size: 1.672 * scaleFactor, realSize: '116460', distance: 70000, speed: 0.0002, texture: '/assets/saturn_texture.jpg', moons: 0 },
      { name: 'Uranus', size: 0.728 * scaleFactor, realSize: '50724', distance: 90000, speed: 0.00015, texture: '/assets/uranus_texture.jpg', moons: 0 },
      { name: 'Neptune', size: 0.708 * scaleFactor, realSize: '49244', distance: 110000, speed: 0.0001, texture: '/assets/neptune_texture.jpg', moons: 0 }
    ];

    planetData.forEach(data => {
      const geometry = new THREE.SphereGeometry(data.size, 64, 64);
      const texture = textureLoader.load(data.texture);
      const material = new THREE.MeshPhongMaterial({ map: texture, shininess: 50 });
      const planet = new THREE.Mesh(geometry, material);

      const initialAngle = Math.random() * Math.PI * 2;
      planet.position.set(
        data.distance * Math.cos(initialAngle),
        0,
        data.distance * Math.sin(initialAngle)
      );
      this.scene.add(planet);

      // Create orbital path with increased visibility
      const orbitCurve = new THREE.EllipseCurve(0, 0, data.distance, data.distance, 0, 2 * Math.PI, false, 0);
      const points = orbitCurve.getPoints(200);
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        opacity: 0.8,
        transparent: true,
        linewidth: 2
      });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      orbit.visible = this.showOrbits;
      this.scene.add(orbit);

      const orbitContainer = new THREE.Object3D();
      orbitContainer.add(orbit);
      this.scene.add(orbitContainer);

      const nameSprite = this.createNameSprite(data.name, data.size);
      this.scene.add(nameSprite);

      const sizeSprite = this.createSizeSprite(data.realSize, data.size);
      this.scene.add(sizeSprite);

      const moons = this.createMoons(data.moons, data.size, textureLoader, data.name === 'Earth');
      moons.forEach(moon => {
        moon.mesh.scale.set(1.5, 1.5, 1.5);
        this.scene.add(moon.mesh);
        if (moon.orbit) {
          moon.orbit.rotation.x = Math.PI / 2;
          this.scene.add(moon.orbit);
        }
        moon.mesh.visible = this.showMoons;
      });

      this.planets.push({
        mesh: planet,
        distance: data.distance,
        speed: data.speed,
        radius: data.size,
        name: data.name,
        nameSprite,
        sizeSprite,
        orbit,
        orbitContainer,
        moons
      });
    });

    const saturn = this.planets.find(p => p.name === 'Saturn')!.mesh;
    const saturnRadius = this.planets.find(p => p.name === 'Saturn')!.radius;

    // Create inner and outer rings
    const innerRadius = saturnRadius * 1.2;
    const outerRadius = saturnRadius * 2.4;

    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringTexture = textureLoader.load('/assets/saturn_rings.png');
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    rings.position.y = 0;

    // Add rings to both the scene and the planet
    this.scene.add(rings);
    saturn.add(rings);

    // Add rings to the planet object for reference
    const saturnPlanet = this.planets.find(p => p.name === 'Saturn');
    if (saturnPlanet) {
      saturnPlanet.rings = rings;
    }
  }

  private createNameSprite(name: string, size: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white';
    context.font = 'bold 72px Arial';
    context.textAlign = 'center';
    context.fillText(name, 512, 160);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4000, 1000, 1);
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
      const moonTexture = textureLoader.load('/assets/moon_texture.jpg');
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
    this.sunLight = new THREE.PointLight(0xFFC107, 5, 50000, 1.5);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  private addStarfield(): void {
    const starGeometry = new THREE.SphereGeometry(25000, 32, 32);
    const starTexture = new THREE.TextureLoader().load('/assets/starfield_texture.jpg');
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide, opacity: 0.5, transparent: true });
    const starfield = new THREE.Mesh(starGeometry, starMaterial);
    this.scene.add(starfield);
  }

  private setupControls(): void {
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

    // Camera animation for initial view
    if (this.isLoaded && time < 10) {
      const progress = Math.min(time / 10, 1);
      const startPos = new THREE.Vector3(0, 200000, 400000);
      const endPos = new THREE.Vector3(0, 25000, 75000);

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      this.camera.position.lerpVectors(startPos, endPos, easedProgress);
    }

    this.sun.rotation.y += 0.001;

    this.planets.forEach(planet => {
      // Calculate position along the orbital path
      const angle = time * planet.speed;
      const x = planet.distance * Math.cos(angle);
      const z = planet.distance * Math.sin(angle);

      // Update planet position
      planet.mesh.position.set(x, 0, z);
      planet.mesh.rotation.y += 0.02;

      // Update orbital path container position
      if (planet.orbitContainer) {
        planet.orbitContainer.position.set(0, 0, 0);
      }

      // Update name and size sprites
      if (planet.nameSprite) {
        planet.nameSprite.position.set(x, planet.radius * 1.5, z);
      }

      if (planet.sizeSprite) {
        planet.sizeSprite.position.set(x, planet.radius * 2, z);
      }

      // Update moons
      planet.moons.forEach(moon => {
        const moonAngle = time * moon.speed;
        const moonX = x + moon.orbitRadius * Math.cos(moonAngle);
        const moonZ = z + moon.orbitRadius * Math.sin(moonAngle);

        moon.mesh.position.set(moonX, 0, moonZ);
        moon.mesh.rotation.y += 0.02;

        if (moon.orbit) {
          moon.orbit.position.set(x, 0, z);
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
    this.planets.forEach(planet => {
      if (planet.orbit) planet.orbit.visible = this.showOrbits;
      planet.moons.forEach(moon => {
        if (moon.orbit) moon.orbit.visible = this.showOrbits && this.showMoons;
      });
    });
  }

  toggleMoons(): void {
    this.planets.forEach(planet => {
      planet.moons.forEach(moon => {
        moon.mesh.visible = this.showMoons;
        if (moon.orbit) moon.orbit.visible = this.showMoons && this.showOrbits;
      });
    });
  }

  focusOnTarget(): void {
    this.planets.forEach(planet => {
      if (planet.nameSprite) planet.nameSprite.visible = true;
      if (planet.sizeSprite) planet.sizeSprite.visible = true;
    });

    if (this.focusTarget === 'Interstellar Path') {
      this.isInfoBoxVisible = false;
      this.controls.target.set(0, 0, 0);
      this.camera.position.set(0, 75000, 150000);
    } else if (this.focusTarget === 'Sun') {
      this.isInfoBoxVisible = true;
      this.selectedTargetDetails = this.targetDetails['Sun'];
      this.controls.target.copy(this.sun.position);
      const distance = 10000;
      this.camera.position.set(
        this.sun.position.x,
        this.sun.position.y + distance * 0.5,
        this.sun.position.z + distance
      );
      this.controls.autoRotate = false;
    } else if (this.focusTarget === 'Moon') {
      const earth = this.planets.find(p => p.name === 'Earth');
      if (earth && earth.moons.length > 0) {
        const moon = earth.moons[0];
        this.isInfoBoxVisible = true;
        this.selectedTargetDetails = this.targetDetails['Moon'];
        this.controls.target.copy(moon.mesh.position);
        this.camera.position.set(moon.mesh.position.x, moon.mesh.position.y + moon.radius * 2, moon.mesh.position.z + moon.radius * 5);
        if (earth.nameSprite) earth.nameSprite.visible = false;
        if (earth.sizeSprite) earth.sizeSprite.visible = false;
      }
    } else {
      const planet = this.planets.find(p => p.name === this.focusTarget);
      if (planet) {
        this.isInfoBoxVisible = true;
        this.selectedTargetDetails = this.targetDetails[planet.name];
        this.controls.target.copy(planet.mesh.position);
        this.camera.position.set(planet.mesh.position.x, planet.mesh.position.y + planet.radius * 2, planet.mesh.position.z + planet.radius * 5);
        if (planet.nameSprite) planet.nameSprite.visible = false;
        if (planet.sizeSprite) planet.sizeSprite.visible = false;
      }
    }

    // Auto-close control box on smaller screens
    if (!this.isDesktop()) {
      this.isControlBoxVisible = false;
    }

    this.controls.update();
  }

  toggleControlBox(): void {
    this.isControlBoxVisible = !this.isControlBoxVisible;
    const controlBox = document.querySelector('.control-box');
    if (controlBox) {
      if (this.isControlBoxVisible) {
        controlBox.classList.add('visible');
      } else {
        controlBox.classList.remove('visible');
      }
    }
  }

  closeInfoBox(): void {
    this.isInfoBoxVisible = false;
  }

  isDesktop(): boolean {
    return this.screenWidth > 768;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth = window.innerWidth;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
  }

  private setupDragHandlers(): void {
    const infoBox = this.infoBox?.nativeElement;
    if (!infoBox) return;

    infoBox.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === infoBox || infoBox.contains(e.target as Node)) {
        this.isDragging = true;
        const rect = infoBox.getBoundingClientRect();
        this.dragStartX = e.clientX - rect.left;
        this.dragStartY = e.clientY - rect.top;
      }
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        const newX = e.clientX - this.dragStartX;
        const newY = e.clientY - this.dragStartY;

        // Keep the info box within the viewport
        const maxX = window.innerWidth - infoBox.offsetWidth;
        const maxY = window.innerHeight - infoBox.offsetHeight;

        infoBox.style.left = `${Math.min(Math.max(0, newX), maxX)}px`;
        infoBox.style.top = `${Math.min(Math.max(0, newY), maxY)}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  toggleCalendar(): void {
    this.isCalendarVisible = !this.isCalendarVisible;
    const calendarCard = document.querySelector('.calendar-card');
    if (calendarCard) {
      if (this.isCalendarVisible) {
        calendarCard.classList.add('visible');
      } else {
        calendarCard.classList.remove('visible');
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const calendarCard = this.calendarCard;
    const calendarBtn = event.target as HTMLElement;

    if (calendarCard && this.isCalendarVisible) {
      const isClickInside = calendarCard.contains(event.target as Node);
      const isCalendarBtn = calendarBtn.closest('.calendar-btn');

      if (!isClickInside && !isCalendarBtn) {
        this.toggleCalendar();
      }
    }
  }

  toggleQuote() {
    this.isQuoteVisible = !this.isQuoteVisible;
  }
}
