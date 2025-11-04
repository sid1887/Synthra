"""
Shared data schemas for Synthra
Used across all microservices for consistent data structures
"""

from typing import List, Dict, Optional, Any, Tuple
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from datetime import datetime
import uuid


# ============================================================================
# Enums
# ============================================================================

class ComponentType(str, Enum):
    RESISTOR = "resistor"
    CAPACITOR = "capacitor"
    INDUCTOR = "inductor"
    DIODE = "diode"
    ZENER = "zener"
    LED = "led"
    BJT_NPN = "npn"
    BJT_PNP = "pnp"
    MOSFET_N = "nmos"
    MOSFET_P = "pmos"
    OPAMP = "opamp"
    VOLTAGE_SOURCE = "voltage_source"
    CURRENT_SOURCE = "current_source"
    GROUND = "ground"
    VCC = "vcc"
    LOGIC_AND = "and"
    LOGIC_OR = "or"
    LOGIC_NOT = "not"
    LOGIC_XOR = "xor"
    LOGIC_NAND = "nand"
    LOGIC_NOR = "nor"
    FLIPFLOP_D = "dff"
    FLIPFLOP_JK = "jkff"
    IC_GENERIC = "ic"
    CONNECTOR = "connector"
    SWITCH = "switch"
    UNKNOWN = "unknown"


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SimulatorType(str, Enum):
    NGSPICE = "ngspice"
    XYCE = "xyce"
    VERILATOR = "verilator"
    ICARUS = "icarus"


class ReportType(str, Enum):
    LAB_REPORT = "lab_report"
    RESEARCH_DOC = "research_doc"
    DESIGN_BRIEF = "design_brief"
    PRESENTATION = "presentation"


# ============================================================================
# Circuit Components
# ============================================================================

class PinDefinition(BaseModel):
    """Pin definition for a component"""
    id: str
    name: str
    position: Tuple[float, float]  # (x, y) relative to component origin
    net_id: Optional[str] = None


class Component(BaseModel):
    """Circuit component (resistor, capacitor, transistor, etc.)"""
    id: str
    type: ComponentType
    pins: List[PinDefinition]
    
    # Component parameters
    value: Optional[str] = None  # e.g., "10k", "100nF", "2N3904"
    footprint: Optional[str] = None
    manufacturer: Optional[str] = None
    part_number: Optional[str] = None
    
    # Detection metadata
    bounding_box: Optional[Tuple[float, float, float, float]] = None  # (x1, y1, x2, y2)
    confidence: Optional[float] = None
    
    # SPICE/HDL models
    spice_model: Optional[str] = None
    verilog_template: Optional[str] = None
    
    model_config = ConfigDict(use_enum_values=True)


class Node(BaseModel):
    """Circuit node (net)"""
    id: str
    name: Optional[str] = None  # e.g., "Vcc", "OUT", "n001"
    points: List[Tuple[float, float]]  # Wire path coordinates
    connected_pins: List[str] = []  # Component pin IDs


class Circuit(BaseModel):
    """Complete circuit representation"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    components: List[Component]
    nodes: List[Node]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Generated artifacts
    netlist: Optional[str] = None
    verilog: Optional[str] = None
    testbench: Optional[str] = None
    svg_schematic: Optional[str] = None
    
    confidence_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Detection Results
# ============================================================================

class DetectedComponent(BaseModel):
    """Result from ML component detection"""
    component_type: ComponentType
    bounding_box: Tuple[float, float, float, float]
    confidence: float
    segmentation_mask: Optional[List[Tuple[float, float]]] = None  # Polygon points
    
    # OCR results for text near component
    detected_text: Optional[str] = None
    text_confidence: Optional[float] = None


class WireSegment(BaseModel):
    """Detected wire segment"""
    points: List[Tuple[float, float]]
    confidence: float


class DetectionResult(BaseModel):
    """Complete detection output from Vision service"""
    job_id: str
    image_path: str
    components: List[DetectedComponent]
    wires: List[WireSegment]
    
    # Image preprocessing info
    image_size: Tuple[int, int]
    preprocessing_applied: List[str] = []
    
    overall_confidence: float
    processing_time_ms: int
    
    model_config = ConfigDict(use_enum_values=True)


# ============================================================================
# Netlist & HDL
# ============================================================================

class NetlistFormat(str, Enum):
    SPICE = "spice"
    EDIF = "edif"
    KICAD = "kicad"


class Netlist(BaseModel):
    """Generated netlist"""
    format: NetlistFormat
    content: str
    components_count: int
    nets_count: int
    
    # Validation
    syntax_valid: bool = True
    warnings: List[str] = []
    
    model_config = ConfigDict(use_enum_values=True)


class HDLModule(BaseModel):
    """Generated HDL module"""
    module_name: str
    language: str  # "verilog", "systemverilog", "vhdl"
    content: str
    
    # Module interface
    ports: List[Dict[str, Any]] = []
    parameters: List[Dict[str, Any]] = []
    
    # Testbench
    testbench: Optional[str] = None
    
    syntax_valid: bool = True
    warnings: List[str] = []


# ============================================================================
# Simulation
# ============================================================================

class SimulationParameters(BaseModel):
    """Simulation configuration"""
    simulator: SimulatorType
    simulation_type: str  # "transient", "dc", "ac", "digital"
    
    # Time/frequency parameters
    start_time: Optional[float] = 0.0
    stop_time: Optional[float] = None
    step_time: Optional[float] = None
    
    # Probes
    probe_nodes: List[str] = []  # Nodes to capture
    
    # Additional options
    options: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(use_enum_values=True)


class WaveformData(BaseModel):
    """Simulation waveform output"""
    signal_name: str
    time: List[float]
    values: List[float]
    units: str  # "V", "A", "Hz", etc.


class SimulationResult(BaseModel):
    """Simulation output"""
    job_id: str
    circuit_id: str
    simulator: SimulatorType
    simulation_type: str
    
    success: bool
    waveforms: List[WaveformData] = []
    
    # File paths
    csv_path: Optional[str] = None
    vcd_path: Optional[str] = None
    raw_path: Optional[str] = None
    
    logs: str = ""
    warnings: List[str] = []
    errors: List[str] = []
    
    runtime_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(use_enum_values=True)


# ============================================================================
# PDF Report
# ============================================================================

class ReportAssets(BaseModel):
    """Assets for PDF generation"""
    schematic_svg: str
    waveform_paths: List[str] = []
    component_table: Optional[Dict[str, Any]] = None
    verilog_code: Optional[str] = None
    testbench_code: Optional[str] = None
    netlist: Optional[str] = None


class ReportConfig(BaseModel):
    """PDF report configuration"""
    report_type: ReportType
    template: str = "default"
    
    title: str
    author: Optional[str] = None
    
    # Content sections
    include_theory: bool = False
    include_methodology: bool = True
    include_simulation: bool = True
    include_code: bool = True
    include_appendix: bool = False
    
    # Narrative generation
    prompt: Optional[str] = None
    use_ai_narrative: bool = False
    
    language: str = "en"
    
    model_config = ConfigDict(use_enum_values=True)


class ReportResult(BaseModel):
    """Generated PDF report"""
    job_id: str
    pdf_path: str
    file_size_bytes: int
    
    narrative: Optional[str] = None
    latex_source: Optional[str] = None
    
    compilation_logs: str = ""
    success: bool
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# API Request/Response Models
# ============================================================================

class UploadImageRequest(BaseModel):
    """Image upload request"""
    # File will be multipart/form-data
    preprocessing_options: Optional[Dict[str, Any]] = Field(default_factory=dict)
    user_id: Optional[str] = None


class UploadImageResponse(BaseModel):
    """Image upload response"""
    job_id: str
    status: JobStatus
    message: str
    
    model_config = ConfigDict(use_enum_values=True)


class JobStatusResponse(BaseModel):
    """Job status query response"""
    job_id: str
    status: JobStatus
    progress: float = 0.0  # 0.0 to 1.0
    
    result: Optional[Any] = None
    error_message: Optional[str] = None
    
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(use_enum_values=True)


class AcceptEditsRequest(BaseModel):
    """User corrections to detected circuit"""
    job_id: str
    corrected_circuit: Circuit


class SimulateRequest(BaseModel):
    """Simulation request"""
    circuit_id: Optional[str] = None
    netlist: Optional[str] = None
    parameters: SimulationParameters


class GeneratePDFRequest(BaseModel):
    """PDF generation request"""
    circuit_id: str
    simulation_id: Optional[str] = None
    assets: ReportAssets
    config: ReportConfig


# ============================================================================
# Health Check
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Service health check"""
    service: str
    status: str  # "healthy", "degraded", "unhealthy"
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None
