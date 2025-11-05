-- Synthra Database Schema
-- Core tables for circuit storage, jobs, and artifacts

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (simplified for now)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Circuits table - stores canonical circuit data
CREATE TABLE IF NOT EXISTS circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version INTEGER DEFAULT 1,
    
    -- Circuit topology (JSONB for flexibility)
    components JSONB NOT NULL DEFAULT '[]',
    nodes JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Generated artifacts
    netlist TEXT,
    verilog TEXT,
    testbench TEXT,
    svg_schematic TEXT,
    
    -- State tracking
    status VARCHAR(50) DEFAULT 'draft',
    confidence_score FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table - tracks async processing
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    job_type VARCHAR(50) NOT NULL, -- 'detection', 'simulation', 'pdf_generation'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simulations table - stores simulation results
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    simulator VARCHAR(50) NOT NULL, -- 'ngspice', 'verilator', 'icarus'
    simulation_type VARCHAR(50), -- 'transient', 'dc', 'ac', 'digital'
    
    parameters JSONB,
    waveform_data JSONB,
    csv_path TEXT,
    vcd_path TEXT,
    logs TEXT,
    
    success BOOLEAN DEFAULT false,
    runtime_ms INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table - tracks generated PDFs
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    report_type VARCHAR(50), -- 'lab_report', 'research_doc', 'design_brief'
    template VARCHAR(50),
    
    prompt TEXT,
    narrative TEXT,
    pdf_path TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artifacts table - stores uploaded images and generated files
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    artifact_type VARCHAR(50) NOT NULL, -- 'image', 'netlist', 'svg', 'pdf', 'vcd'
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Component library table - reusable component definitions
CREATE TABLE IF NOT EXISTS component_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    component_type VARCHAR(100) NOT NULL,
    symbol_name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'passive', 'active', 'digital', 'power'
    
    -- Visual representation
    svg_symbol TEXT,
    pin_definitions JSONB, -- [{"id": "1", "name": "anode", "position": [0, 0]}]
    
    -- Electrical models
    spice_model TEXT,
    verilog_template TEXT,
    
    -- Metadata
    manufacturer VARCHAR(255),
    datasheet_url TEXT,
    footprint VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_type, symbol_name)
);

-- SVE Components table - AI-generated component symbols
CREATE TABLE IF NOT EXISTS components (
    id SERIAL PRIMARY KEY,
    component_type VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- SVG content and metadata
    svg_content TEXT NOT NULL,
    svg_hash VARCHAR(64) NOT NULL,
    
    -- Component properties
    pins INTEGER,
    metadata JSONB DEFAULT '{}',
    style VARCHAR(50) DEFAULT 'IEEE',
    
    -- AI generation tracking
    generation_prompt TEXT,
    quality_score FLOAT DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training data table - for active learning
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    image_path TEXT NOT NULL,
    annotations JSONB NOT NULL, -- COCO/YOLO format
    
    source VARCHAR(50), -- 'user_correction', 'manual', 'synthetic'
    quality_score FLOAT,
    verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_circuits_project ON circuits(project_id);
CREATE INDEX idx_circuits_status ON circuits(status);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_circuit ON jobs(circuit_id);
CREATE INDEX idx_simulations_circuit ON simulations(circuit_id);
CREATE INDEX idx_artifacts_circuit ON artifacts(circuit_id);
CREATE INDEX idx_component_library_type ON component_library(component_type);

-- SVE components indexes
CREATE INDEX idx_components_type ON components(component_type);
CREATE INDEX idx_components_category ON components(category);
CREATE INDEX idx_components_usage ON components(usage_count DESC);

-- GIN indexes for JSONB queries
CREATE INDEX idx_circuits_components ON circuits USING GIN (components);
CREATE INDEX idx_circuits_nodes ON circuits USING GIN (nodes);
CREATE INDEX idx_simulations_waveform ON simulations USING GIN (waveform_data);

-- Full-text search on component library
CREATE INDEX idx_component_search ON component_library USING GIN (to_tsvector('english', symbol_name || ' ' || COALESCE(manufacturer, '')));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_circuits_updated_at BEFORE UPDATE ON circuits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_component_library_updated_at BEFORE UPDATE ON component_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (id, username, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@synthra.local')
ON CONFLICT (username) DO NOTHING;

-- Insert some basic components to the library
INSERT INTO component_library (component_type, symbol_name, category, pin_definitions) VALUES
('resistor', 'R', 'passive', '[{"id": "1", "name": "p", "position": [0, 0]}, {"id": "2", "name": "n", "position": [10, 0]}]'),
('capacitor', 'C', 'passive', '[{"id": "1", "name": "p", "position": [0, 0]}, {"id": "2", "name": "n", "position": [10, 0]}]'),
('inductor', 'L', 'passive', '[{"id": "1", "name": "p", "position": [0, 0]}, {"id": "2", "name": "n", "position": [10, 0]}]'),
('diode', 'D', 'active', '[{"id": "1", "name": "anode", "position": [0, 0]}, {"id": "2", "name": "cathode", "position": [10, 0]}]'),
('npn', 'Q', 'active', '[{"id": "1", "name": "collector", "position": [5, 0]}, {"id": "2", "name": "base", "position": [0, 5]}, {"id": "3", "name": "emitter", "position": [5, 10]}]'),
('voltage_source', 'V', 'power', '[{"id": "1", "name": "pos", "position": [0, 0]}, {"id": "2", "name": "neg", "position": [0, 10]}]'),
('ground', 'GND', 'power', '[{"id": "1", "name": "gnd", "position": [0, 0]}]')
ON CONFLICT (component_type, symbol_name) DO NOTHING;
