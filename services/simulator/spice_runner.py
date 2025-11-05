"""
SPICE Simulation Runner
Executes ngspice/Xyce simulations and captures waveforms
"""

import subprocess
import tempfile
import os
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import re


class SPICESimulator:
    """Run SPICE simulations using ngspice"""
    
    def __init__(self, simulator: str = "ngspice"):
        """
        Initialize simulator
        
        Args:
            simulator: "ngspice" or "xyce"
        """
        self.simulator = simulator
        self._check_installation()
    
    def _check_installation(self) -> bool:
        """Check if simulator is installed"""
        try:
            result = subprocess.run(
                [self.simulator, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            print(f"Warning: {self.simulator} not found in PATH")
            return False
    
    def simulate(
        self,
        netlist: str,
        output_format: str = "csv",
        timeout: int = 60
    ) -> Dict[str, Any]:
        """
        Run SPICE simulation
        
        Args:
            netlist: SPICE netlist content
            output_format: "csv" or "raw"
            timeout: Simulation timeout in seconds
            
        Returns:
            Dict with:
                - 'success': bool
                - 'waveforms': Dict[str, List[float]]
                - 'time': List[float]
                - 'log': str
                - 'errors': List[str]
        """
        # Create temporary directory for simulation
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            
            # Write netlist
            netlist_path = tmpdir_path / "circuit.cir"
            netlist_path.write_text(netlist)
            
            # Add output commands if not present
            if output_format == "csv":
                modified_netlist = self._add_csv_output(netlist, tmpdir_path)
                netlist_path.write_text(modified_netlist)
            
            # Run simulation
            try:
                result = subprocess.run(
                    [self.simulator, "-b", str(netlist_path)],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=tmpdir_path
                )
                
                log = result.stdout + result.stderr
                success = result.returncode == 0
                
                # Parse output
                if success and output_format == "csv":
                    waveforms, time = self._parse_csv_output(tmpdir_path)
                else:
                    waveforms, time = {}, []
                
                # Extract errors
                errors = self._extract_errors(log)
                
                return {
                    'success': success,
                    'waveforms': waveforms,
                    'time': time,
                    'log': log,
                    'errors': errors,
                    'returncode': result.returncode
                }
                
            except subprocess.TimeoutExpired:
                return {
                    'success': False,
                    'waveforms': {},
                    'time': [],
                    'log': f"Simulation timeout after {timeout}s",
                    'errors': ["Simulation timeout"],
                    'returncode': -1
                }
            except Exception as e:
                return {
                    'success': False,
                    'waveforms': {},
                    'time': [],
                    'log': str(e),
                    'errors': [str(e)],
                    'returncode': -1
                }
    
    def _add_csv_output(self, netlist: str, output_dir: Path) -> str:
        """Add CSV export commands to netlist"""
        lines = netlist.split('\n')
        
        # Find .control block or create one
        control_start = -1
        control_end = -1
        
        for i, line in enumerate(lines):
            if '.control' in line.lower():
                control_start = i
            if '.endc' in line.lower() and control_start != -1:
                control_end = i
                break
        
        if control_start == -1:
            # No control block, add one before .end
            end_idx = next((i for i, l in enumerate(lines) if '.end' in l.lower()), len(lines))
            lines.insert(end_idx, '.endc')
            lines.insert(end_idx, 'write output.csv')
            lines.insert(end_idx, 'run')
            lines.insert(end_idx, '.control')
        else:
            # Add write command before .endc
            if 'write' not in '\n'.join(lines[control_start:control_end]).lower():
                lines.insert(control_end, 'write output.csv')
        
        return '\n'.join(lines)
    
    def _parse_csv_output(self, output_dir: Path) -> Tuple[Dict[str, List[float]], List[float]]:
        """Parse CSV output from ngspice"""
        csv_file = output_dir / "output.csv"
        
        if not csv_file.exists():
            return {}, []
        
        waveforms = {}
        time = []
        
        try:
            import csv
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    if not waveforms:
                        # Initialize waveform arrays
                        for key in row.keys():
                            waveforms[key] = []
                    
                    for key, value in row.items():
                        try:
                            waveforms[key].append(float(value))
                        except ValueError:
                            waveforms[key].append(0.0)
                
                # Extract time vector
                time_keys = ['time', 'Time', 'TIME', 't']
                for key in time_keys:
                    if key in waveforms:
                        time = waveforms.pop(key)
                        break
        
        except Exception as e:
            print(f"Error parsing CSV: {e}")
            return {}, []
        
        return waveforms, time
    
    def _extract_errors(self, log: str) -> List[str]:
        """Extract error messages from simulation log"""
        errors = []
        
        error_patterns = [
            r'error:(.+)',
            r'Error:(.+)',
            r'ERROR:(.+)',
            r'fatal:(.+)',
            r'Fatal:(.+)',
        ]
        
        for pattern in error_patterns:
            matches = re.findall(pattern, log, re.IGNORECASE)
            errors.extend([m.strip() for m in matches])
        
        return errors
    
    def validate_netlist(self, netlist: str) -> Dict[str, Any]:
        """
        Validate netlist without running full simulation
        
        Returns:
            Dict with 'valid' bool and 'errors' list
        """
        # Basic syntax checks
        errors = []
        
        if not netlist.strip():
            errors.append("Empty netlist")
            return {'valid': False, 'errors': errors}
        
        lines = netlist.strip().split('\n')
        
        # Check for title
        if not lines[0].startswith('*'):
            errors.append("First line must be title comment")
        
        # Check for .end
        if not any('.end' in l.lower() for l in lines):
            errors.append("Missing .end statement")
        
        # Check for components
        has_components = any(
            l.strip() and not l.startswith('*') and not l.startswith('.') 
            for l in lines
        )
        
        if not has_components:
            errors.append("No components found")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def extract_operating_point(self, log: str) -> Dict[str, float]:
        """Extract DC operating point values from log"""
        op_values = {}
        
        # ngspice OP output format:
        # v(node) = value
        pattern = r'v\((\w+)\)\s*=\s*([\d.e+-]+)'
        matches = re.findall(pattern, log)
        
        for node, value in matches:
            op_values[node] = float(value)
        
        return op_values


def run_spice_simulation(
    netlist: str,
    simulator: str = "ngspice",
    timeout: int = 60
) -> Dict[str, Any]:
    """Convenience function to run SPICE simulation"""
    sim = SPICESimulator(simulator)
    return sim.simulate(netlist, timeout=timeout)
