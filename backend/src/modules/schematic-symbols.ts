/**
 * Schematic Symbol Generator
 * Creates IEC 60617 standard schematic symbols in SVG format
 */

export interface SymbolOptions {
  size?: number; // Base size in mm (default 10)
  strokeWidth?: number; // Line width
  fill?: boolean; // Fill solid shapes
  color?: string; // Stroke color
  label?: string; // Component label
}

/**
 * Generate standard electrical schematic symbols
 */
export class SchematicSymbols {
  /**
   * Generate resistor symbol (zigzag rectangle)
   */
  static resistor(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Resistor zigzag -->
      <path d="M 0 10 L 5 8 L 7 12 L 9 8 L 11 12 L 13 8 L 15 12 L 17 8 L 19 12 L 21 8 L 23 12 L 25 8 L 27 12 L 29 8 L 31 12 L 35 10 L 40 10" 
            stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Connection lines -->
      <line x1="0" y1="10" x2="0" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <line x1="40" y1="10" x2="40" y2="10" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate capacitor symbol (two parallel lines)
   */
  static capacitor(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Capacitor plates -->
      <line x1="10" y1="5" x2="10" y2="15" stroke="${color}" stroke-width="${sw * 2}"/>
      <line x1="30" y1="5" x2="30" y2="15" stroke="${color}" stroke-width="${sw * 2}"/>
      <!-- Connection lines -->
      <line x1="0" y1="10" x2="10" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <line x1="30" y1="10" x2="40" y2="10" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate LED symbol (diode with light rays)
   */
  static led(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'red';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Diode triangle -->
      <polygon points="15,5 15,15 25,10" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linejoin="round"/>
      <!-- Barrier line -->
      <line x1="25" y1="5" x2="25" y2="15" stroke="${color}" stroke-width="${sw}"/>
      <!-- Light rays -->
      <line x1="28" y1="2" x2="32" y2="-2" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
      <line x1="32" y1="6" x2="36" y2="2" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
      <!-- Connection lines -->
      <line x1="0" y1="10" x2="15" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <line x1="25" y1="10" x2="40" y2="10" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate diode symbol (triangle with barrier)
   */
  static diode(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Diode triangle -->
      <polygon points="15,5 15,15 25,10" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linejoin="round"/>
      <!-- Barrier line -->
      <line x1="25" y1="5" x2="25" y2="15" stroke="${color}" stroke-width="${sw}"/>
      <!-- Connection lines -->
      <line x1="0" y1="10" x2="15" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <line x1="25" y1="10" x2="40" y2="10" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate battery/voltage source symbol
   */
  static battery(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Long line (positive) -->
      <line x1="20" y1="5" x2="20" y2="8" stroke="${color}" stroke-width="${sw * 2}"/>
      <!-- Short line (negative) -->
      <line x1="20" y1="12" x2="20" y2="15" stroke="${color}" stroke-width="${sw}"/>
      <!-- Connection lines -->
      <line x1="0" y1="10" x2="20" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <line x1="20" y1="10" x2="40" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <!-- + and - labels -->
      <text x="23" y="7" font-size="8" font-weight="bold" font-family="Arial">+</text>
      <text x="23" y="16" font-size="8" font-weight="bold" font-family="Arial">−</text>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate transistor symbol (BJT NPN)
   */
  static transistorNPN(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 30" width="${size * 4}" height="${size * 3}" xmlns="http://www.w3.org/2000/svg">
      <!-- Base line -->
      <line x1="10" y1="8" x2="10" y2="22" stroke="${color}" stroke-width="${sw * 1.5}"/>
      <!-- Collector line -->
      <line x1="10" y1="8" x2="20" y2="5" stroke="${color}" stroke-width="${sw}"/>
      <!-- Emitter line -->
      <line x1="10" y1="22" x2="20" y2="25" stroke="${color}" stroke-width="${sw}"/>
      <!-- Arrow on emitter -->
      <polygon points="20,25 18,22 19,20" stroke="${color}" stroke-width="${sw}" fill="${color}"/>
      <!-- Connection lines -->
      <line x1="0" y1="15" x2="10" y2="15" stroke="${color}" stroke-width="${sw}"/>
      <line x1="20" y1="5" x2="35" y2="2" stroke="${color}" stroke-width="${sw}"/>
      <line x1="20" y1="25" x2="35" y2="28" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="25" y="22" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate inductor symbol (coil)
   */
  static inductor(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Coils -->
      <path d="M 0 10 Q 3 7 5 10 Q 7 13 10 10 Q 12 7 15 10 Q 17 13 20 10 Q 22 7 25 10 Q 27 13 30 10 L 40 10" 
            stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate switch symbol
   */
  static switch(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 40 20" width="${size * 4}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Switch contact point -->
      <circle cx="10" cy="10" r="2" stroke="${color}" stroke-width="${sw}" fill="none"/>
      <!-- Switch arm (closed position) -->
      <line x1="10" y1="10" x2="25" y2="8" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
      <!-- Fixed contact -->
      <circle cx="30" cy="6" r="2" stroke="${color}" stroke-width="${sw}" fill="none"/>
      <!-- Connection lines -->
      <line x1="0" y1="10" x2="10" y2="10" stroke="${color}" stroke-width="${sw}"/>
      <line x1="30" y1="6" x2="40" y2="6" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="20" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate ground symbol (earth)
   */
  static ground(options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';

    const svg = `<svg viewBox="0 0 20 20" width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
      <!-- Vertical line -->
      <line x1="10" y1="0" x2="10" y2="6" stroke="${color}" stroke-width="${sw}"/>
      <!-- Ground symbol -->
      <line x1="6" y1="6" x2="14" y2="6" stroke="${color}" stroke-width="${sw * 2}"/>
      <line x1="7" y1="9" x2="13" y2="9" stroke="${color}" stroke-width="${sw * 1.5}"/>
      <line x1="8" y1="12" x2="12" y2="12" stroke="${color}" stroke-width="${sw}"/>
      ${options.label ? `<text x="10" y="18" font-size="6" text-anchor="middle" font-family="Arial">${options.label}</text>` : ''}
    </svg>`;

    return svg;
  }

  /**
   * Generate power rail symbol (+5V, +3.3V, etc.)
   */
  static powerRail(voltage: string, options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'red';

    const svg = `<svg viewBox="0 0 20 25" width="${size * 2}" height="${size * 2.5}" xmlns="http://www.w3.org/2000/svg">
      <!-- Vertical line -->
      <line x1="10" y1="20" x2="10" y2="0" stroke="${color}" stroke-width="${sw}"/>
      <!-- Circle -->
      <circle cx="10" cy="5" r="4" stroke="${color}" stroke-width="${sw}" fill="none"/>
      <!-- Label -->
      <text x="10" y="8" font-size="8" font-weight="bold" text-anchor="middle" font-family="Arial">${voltage}</text>
    </svg>`;

    return svg;
  }

  /**
   * Generate IC (Integrated Circuit) symbol
   */
  static ic(pins: number = 8, label: string = 'IC', options: SymbolOptions = {}): string {
    const size = options.size || 10;
    const sw = options.strokeWidth || 1;
    const color = options.color || 'black';
    const width = 40;
    const height = pins > 8 ? 60 : 40;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="${size * (width / 10)}" height="${size * (height / 10)}" xmlns="http://www.w3.org/2000/svg">
      <!-- IC body -->
      <rect x="5" y="5" width="30" height="${height - 10}" stroke="${color}" stroke-width="${sw}" fill="white"/>
      <!-- Notch (pin 1 indicator) -->
      <circle cx="20" cy="10" r="3" stroke="${color}" stroke-width="${sw}" fill="white"/>
      <!-- Label -->
      <text x="20" y="${height / 2}" font-size="8" font-weight="bold" text-anchor="middle" font-family="Arial">${label}</text>`;

    // Generate pins
    const pinsPerSide = Math.ceil(pins / 2);
    for (let i = 1; i <= pinsPerSide; i++) {
      const y = 15 + ((i - 1) * (height - 30) / (pinsPerSide - 1));
      // Left pin
      svg += `<line x1="0" y1="${y}" x2="5" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
      svg += `<text x="2" y="${y + 3}" font-size="6" text-anchor="middle" font-family="Arial">${i}</text>`;
      // Right pin
      if (i <= pins - pinsPerSide) {
        svg += `<line x1="35" y1="${y}" x2="40" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
        svg += `<text x="38" y="${y + 3}" font-size="6" text-anchor="middle" font-family="Arial">${pins - i + 1}</text>`;
      }
    }

    svg += `</svg>`;
    return svg;
  }

  /**
   * Generate symbol library (all components)
   */
  static library(): Record<string, (options: SymbolOptions) => string> {
    return {
      resistor: this.resistor,
      capacitor: this.capacitor,
      inductor: this.inductor,
      diode: this.diode,
      led: this.led,
      battery: this.battery,
      transistor_npn: this.transistorNPN,
      switch: this.switch,
      ground: this.ground,
    };
  }

  /**
   * Generate complete schematic with connections
   */
  static generateCircuitDiagram(components: Array<{ type: string; label: string; x: number; y: number }>, connections: Array<{ from: string; to: string }>): string {
    const width = 400;
    const height = 300;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid #ccc;">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#000" />
        </marker>
      </defs>`;

    // Background
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;

    // Title
    svg += `<text x="${width / 2}" y="20" font-size="14" font-weight="bold" text-anchor="middle" font-family="Arial">Circuit Schematic</text>`;

    // Components
    for (const comp of components) {
      svg += `<g transform="translate(${comp.x}, ${comp.y})">`;
      if (comp.type === 'resistor') {
        svg += this.resistor({ size: 8 });
      } else if (comp.type === 'capacitor') {
        svg += this.capacitor({ size: 8 });
      } else if (comp.type === 'led') {
        svg += this.led({ size: 8 });
      } else if (comp.type === 'battery') {
        svg += this.battery({ size: 8 });
      } else if (comp.type === 'switch') {
        svg += this.switch({ size: 8 });
      }
      svg += `<text x="20" y="35" font-size="10" text-anchor="middle" font-family="Arial">${comp.label}</text>`;
      svg += `</g>`;
    }

    // Connections (wires)
    for (const conn of connections) {
      svg += `<line x1="${conn.from.split(',')[0]}" y1="${conn.from.split(',')[1]}" x2="${conn.to.split(',')[0]}" y2="${conn.to.split(',')[1]}" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }

    svg += `</svg>`;
    return svg;
  }
}

export default SchematicSymbols;
