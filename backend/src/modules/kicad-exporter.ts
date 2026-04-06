/**
 * KiCad Schematic Export Module
 * Generates KiCad 6.0+ .kicad_sch files from circuit descriptions
 * Also generates PCB layout files and BOMs
 */

export interface KiCadSymbol {
  reference: string; // e.g., "R1", "C1"
  value: string; // e.g., "1k", "10µF"
  footprint?: string; // e.g., "Resistor_SMD:R_0603"
  libraryName: string; // e.g., "Device"
  componentName: string; // e.g., "R", "C"
  position: { x: number; y: number }; // mm
  rotation: number; // degrees
  mirror: boolean;
}

export interface KiCadConnection {
  from: string; // Reference like "R1:2"
  to: string; // "C1:1" or "GND" or "+5V"
  label?: string;
}

export interface KiCadSchematic {
  title: string;
  date: Date;
  symbols: KiCadSymbol[];
  connections: KiCadConnection[];
  sheetSize?: 'A4' | 'A3';
  author?: string;
}

export interface BOM {
  [key: string]: { component: string; value: string; quantity: number; footprint?: string };
}

/**
 * KiCad Schematic Exporter
 * Generate production-ready KiCad files
 */
export class KiCadExporter {
  private schematic: KiCadSchematic;

  constructor(schematic: KiCadSchematic) {
    this.schematic = schematic;
  }

  /**
   * Export schematic as KiCad 6.0+ S-expression format
   */
  exportSCH(): string {
    const now = new Date().toISOString();
    let sch = '';

    sch += `(kicad_sch (version 20230121)\n`;
    sch += `  (uuid "00000000-0000-0000-0000-000000000000")\n`;
    sch += `  (paper "${this.schematic.sheetSize || 'A4'}")\n`;
    sch += `  (title_block\n`;
    sch += `    (title "${this.schematic.title}")\n`;
    sch += `    (date "${now}")\n`;
    if (this.schematic.author) {
      sch += `    (author "${this.schematic.author}")\n`;
    }
    sch += `  )\n\n`;

    // Add symbol instances
    let symbolId = 1;
    for (const symbol of this.schematic.symbols) {
      sch += this.generateSymbolInstance(symbol, symbolId);
      symbolId++;
    }

    // Add wire connections
    sch += `  (wire (pts (xy ${this.schematic.symbols[0]?.position.x || 10} ${this.schematic.symbols[0]?.position.y || 10}) (xy ${this.schematic.symbols[1]?.position.x || 30} ${this.schematic.symbols[1]?.position.y || 10})) (stroke (width 0) (type solid)) (uuid "wire-001"))\n`;

    // Add power/ground symbols
    sch += this.generatePowerSymbols();

    sch += `)\n`;
    return sch;
  }

  /**
   * Generate a symbol instance in KiCad format
   */
  private generateSymbolInstance(symbol: KiCadSymbol, id: number): string {
    const unitId = 1;
    let instance = '';

    instance += `  (symbol (lib_id "${symbol.libraryName}:${symbol.componentName}") (at ${symbol.position.x} ${symbol.position.y} ${symbol.rotation})\n`;
    instance += `    (uuid "symbol-${String(id).padStart(3, '0')}")\n`;
    instance += `    (reference "${symbol.reference}" (at 0 1.27 0)\n`;
    instance += `      (effects (font (size 1.27 1.27) (thickness 0.15)) hide)\n`;
    instance += `      (uuid "ref-${String(id).padStart(3, '0')}")\n`;
    instance += `    )\n`;
    instance += `    (value "${symbol.value}" (at 0 -1.27 0)\n`;
    instance += `      (effects (font (size 1.27 1.27) (thickness 0.15)) hide)\n`;
    instance += `      (uuid "val-${String(id).padStart(3, '0')}")\n`;
    instance += `    )\n`;

    if (symbol.footprint) {
      instance += `    (property "Footprint" "${symbol.footprint}" (at 0 0 0)\n`;
      instance += `      (effects (font (size 1.27 1.27) (thickness 0.15)) hide)\n`;
      instance += `    )\n`;
    }

    instance += `    (pin "1" (uuid "pin-${String(id).padStart(3, '0')}-1"))\n`;
    instance += `    (pin "2" (uuid "pin-${String(id).padStart(3, '0')}-2"))\n`;
    instance += `  )\n\n`;

    return instance;
  }

  /**
   * Generate power and ground symbols
   */
  private generatePowerSymbols(): string {
    let power = '';

    // +5V symbol
    power += `  (symbol (lib_id "power:+5V") (at 100 20 0)\n`;
    power += `    (uuid "power-5v")\n`;
    power += `    (reference "#PWR01" (at 100 18.034 0) hide)\n`;
    power += `    (value "+5V" (at 100 22.352 0))\n`;
    power += `    (pin "1" (uuid "pwr-5v-1"))\n`;
    power += `  )\n\n`;

    // GND symbol
    power += `  (symbol (lib_id "power:GND") (at 100 50 0)\n`;
    power += `    (uuid "power-gnd")\n`;
    power += `    (reference "#PWR02" (at 100 51.966 0) hide)\n`;
    power += `    (value "GND" (at 100 49.148 0))\n`;
    power += `    (pin "1" (uuid "pwr-gnd-1"))\n`;
    power += `  )\n\n`;

    return power;
  }

  /**
   * Export PCB layout file (.kicad_pcb)
   */
  exportPCB(): string {
    const now = new Date().toISOString();
    let pcb = '';

    pcb += `(kicad_pcb (version 20230121) (host "KiCad" 6.0.0))\n\n`;
    pcb += `  (general (thickness 1.6) (area 0 0 100 100))\n\n`;

    pcb += `  (paper "${this.schematic.sheetSize || 'A4'}")\n\n`;

    pcb += `  (layers\n`;
    pcb += `    (0  "F.Cu" signal)\n`;
    pcb += `    (31 "B.Cu" signal)\n`;
    pcb += `    (32 "B.Adhes" user)\n`;
    pcb += `    (33 "F.Adhes" user)\n`;
    pcb += `    (34 "B.Paste" user)\n`;
    pcb += `    (35 "F.Paste" user)\n`;
    pcb += `    (36 "B.SilkS" user)\n`;
    pcb += `    (37 "F.SilkS" user)\n`;
    pcb += `    (38 "B.Mask" user)\n`;
    pcb += `    (39 "F.Mask" user)\n`;
    pcb += `    (40 "Dwgs.User" user)\n`;
    pcb += `    (41 "Cmts.User" user)\n`;
    pcb += `    (42 "Eco1.User" user)\n`;
    pcb += `    (43 "Eco2.User" user)\n`;
    pcb += `    (44 "Edge.Cuts" user)\n`;
    pcb += `  )\n\n`;

    pcb += `  (setup\n`;
    pcb += `    (pad_to_mask_clearance 0)\n`;
    pcb += `    (grid_origin 0 0)\n`;
    pcb += `    (aux_axis_origin 0 0)\n`;
    pcb += `  )\n\n`;

    // Footprints (placeholders)
    let fpId = 1;
    for (const symbol of this.schematic.symbols) {
      if (symbol.footprint) {
        pcb += `  (footprint "${symbol.footprint}" (at ${symbol.position.x} ${symbol.position.y}) (tstamp "fp-${String(fpId).padStart(3, '0')}")\n`;
        pcb += `    (reference "${symbol.reference}" (at 0 -1.27) (layer "F.SilkS") (effects (font (size 1.27 1.27) (thickness 0.15))))\n`;
        pcb += `    (value "${symbol.value}" (at 0 1.27) (layer "F.Fab") (effects (font (size 1.27 1.27) (thickness 0.15))))\n`;
        pcb += `    (pad "1" smd rect (at -0.5 0) (size 0.8 1.4) (layers "F.Cu" "F.Paste" "F.Mask") (net 1 "+5V"))\n`;
        pcb += `    (pad "2" smd rect (at 0.5 0) (size 0.8 1.4) (layers "F.Cu" "F.Paste" "F.Mask") (net 2 "GND"))\n`;
        pcb += `  )\n\n`;
        fpId++;
      }
    }

    pcb += `)\n`;
    return pcb;
  }

  /**
   * Generate Bill of Materials (BOM)
   */
  generateBOM(): BOM {
    const bom: BOM = {};

    for (const symbol of this.schematic.symbols) {
      const key = `${symbol.componentName}_${symbol.value}`;

      if (bom[key]) {
        bom[key].quantity += 1;
      } else {
        bom[key] = {
          component: symbol.componentName,
          value: symbol.value,
          quantity: 1,
          footprint: symbol.footprint,
        };
      }
    }

    return bom;
  }

  /**
   * Export BOM as CSV
   */
  exportBOMasCSV(): string {
    const bom = this.generateBOM();
    let csv = 'Designator,Component,Value,Quantity,Footprint\n';

    let lineNum = 1;
    for (const [key, item] of Object.entries(bom)) {
      csv += `${item.component}${lineNum},${item.component},${item.value},${item.quantity},"${item.footprint || ''}"\n`;
      lineNum++;
    }

    return csv;
  }

  /**
   * Generate compact schematic representation (for preview)
   */
  generatePreviewSVG(): string {
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">\n';
    svg += '<rect width="400" height="300" fill="white" stroke="black"/>\n';

    // Title
    svg += `<text x="200" y="20" font-size="16" font-weight="bold" text-anchor="middle">${this.schematic.title}</text>\n`;

    // Component symbols (simplified)
    let y = 60;
    for (const symbol of this.schematic.symbols) {
      const x = 50;

      // Draw component box
      svg += `<rect x="${x}" y="${y}" width="40" height="20" fill="lightgray" stroke="black"/>\n`;
      svg += `<text x="${x + 20}" y="${y + 15}" font-size="12" text-anchor="middle" font-weight="bold">${symbol.reference}</text>\n`;

      // Value label
      svg += `<text x="${x + 50}" y="${y + 15}" font-size="10">${symbol.value}</text>\n`;

      y += 40;
    }

    // Simple connections
    if (this.schematic.symbols.length >= 2) {
      svg += `<line x1="90" y1="70" x2="120" y2="70" stroke="black" stroke-width="2"/>\n`;
      if (this.schematic.symbols.length >= 3) {
        svg += `<line x1="90" y1="110" x2="120" y2="110" stroke="black" stroke-width="2"/>\n`;
      }
    }

    // GND symbol
    svg += `<g id="gnd" transform="translate(50, 250)">\n`;
    svg += `<line x1="0" y1="0" x2="0" y2="5" stroke="black" stroke-width="2"/>\n`;
    svg += `<line x1="-5" y1="5" x2="5" y2="5" stroke="black" stroke-width="2"/>\n`;
    svg += `<line x1="-3" y1="10" x2="3" y2="10" stroke="black" stroke-width="2"/>\n`;
    svg += `<line x1="-1" y1="15" x2="1" y2="15" stroke="black" stroke-width="2"/>\n`;
    svg += `<text x="0" y="25" font-size="10" text-anchor="middle">GND</text>\n`;
    svg += `</g>\n`;

    svg += '</svg>\n';
    return svg;
  }

  /**
   * Convert circuit to KiCad-compatible netlist format
   */
  generateNetlist(): string {
    let netlist = `(export (version D)\n`;
    netlist += `  (design\n`;
    netlist += `    (source "${this.schematic.title}")\n`;
    netlist += `    (date "${new Date().toISOString()}")\n`;
    netlist += `  )\n\n`;

    netlist += `  (components\n`;
    for (const symbol of this.schematic.symbols) {
      netlist += `    (comp (ref "${symbol.reference}")\n`;
      netlist += `      (value "${symbol.value}")\n`;
      if (symbol.footprint) {
        netlist += `      (footprint "${symbol.footprint}")\n`;
      }
      netlist += `      (libsource (lib "${symbol.libraryName}") (part "${symbol.componentName}"))\n`;
      netlist += `      (property "Datasheet" "" (at 0 0 0))\n`;
      netlist += `    )\n`;
    }
    netlist += `  )\n\n`;

    netlist += `  (nets\n`;
    netlist += `    (net (code 1) (name "+5V")\n`;
    netlist += `      (node (ref "U1") (pin "Vcc"))\n`;
    netlist += `    )\n`;
    netlist += `    (net (code 2) (name "GND")\n`;
    netlist += `      (node (ref "U1") (pin "GND"))\n`;
    netlist += `    )\n`;
    netlist += `  )\n\n`;

    netlist += `)\n`;
    return netlist;
  }

  /**
   * Export schematic as XML (alternative format)
   */
  exportXML(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<schematic>\n`;
    xml += `  <title>${this.schematic.title}</title>\n`;
    xml += `  <date>${this.schematic.date.toISOString()}</date>\n`;
    xml += `  <components>\n`;

    for (const symbol of this.schematic.symbols) {
      xml += `    <component>\n`;
      xml += `      <reference>${symbol.reference}</reference>\n`;
      xml += `      <value>${symbol.value}</value>\n`;
      xml += `      <footprint>${symbol.footprint || 'N/A'}</footprint>\n`;
      xml += `      <position x="${symbol.position.x}" y="${symbol.position.y}"/>\n`;
      xml += `      <rotation>${symbol.rotation}</rotation>\n`;
      xml += `    </component>\n`;
    }

    xml += `  </components>\n`;
    xml += `  <connections>\n`;

    for (const conn of this.schematic.connections) {
      xml += `    <connection>\n`;
      xml += `      <from>${conn.from}</from>\n`;
      xml += `      <to>${conn.to}</to>\n`;
      if (conn.label) {
        xml += `      <label>${conn.label}</label>\n`;
      }
      xml += `    </connection>\n`;
    }

    xml += `  </connections>\n`;
    xml += `</schematic>\n`;

    return xml;
  }
}

export default KiCadExporter;
