"""
HDL Simulation Runner
Executes Verilator/Icarus Verilog simulations and captures VCD waveforms
"""

import subprocess
import tempfile
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import re


class HDLSimulator:
    """Run HDL simulations using Verilator or Icarus Verilog"""
    
    def __init__(self, simulator: str = "iverilog"):
        """
        Initialize simulator
        
        Args:
            simulator: "iverilog" (Icarus Verilog) or "verilator"
        """
        self.simulator = simulator
        self._check_installation()
    
    def _check_installation(self) -> bool:
        """Check if simulator is installed"""
        try:
            if self.simulator == "iverilog":
                cmd = ["iverilog", "-v"]
            else:  # verilator
                cmd = ["verilator", "--version"]
            
            result = subprocess.run(
                cmd,
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
        hdl_files: List[str],
        testbench: str,
        top_module: str = "testbench",
        timeout: int = 60,
        timescale: str = "1ns/1ps"
    ) -> Dict[str, Any]:
        """
        Run HDL simulation
        
        Args:
            hdl_files: List of HDL source file contents
            testbench: Testbench HDL content
            top_module: Name of top module
            timeout: Simulation timeout in seconds
            timescale: Time scale for simulation
            
        Returns:
            Dict with:
                - 'success': bool
                - 'vcd_file': Path to VCD file
                - 'log': str
                - 'errors': List[str]
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            
            # Write HDL files
            hdl_paths = []
            for i, content in enumerate(hdl_files):
                hdl_path = tmpdir_path / f"module_{i}.sv"
                hdl_path.write_text(content)
                hdl_paths.append(hdl_path)
            
            # Write testbench
            tb_path = tmpdir_path / "testbench.sv"
            tb_path.write_text(testbench)
            
            # Run simulation based on simulator type
            if self.simulator == "iverilog":
                return self._simulate_iverilog(hdl_paths, tb_path, tmpdir_path, timeout)
            else:
                return self._simulate_verilator(hdl_paths, tb_path, tmpdir_path, timeout)
    
    def _simulate_iverilog(
        self,
        hdl_paths: List[Path],
        tb_path: Path,
        work_dir: Path,
        timeout: int
    ) -> Dict[str, Any]:
        """Run simulation using Icarus Verilog"""
        try:
            # Compile
            out_file = work_dir / "sim.vvp"
            compile_cmd = ["iverilog", "-g2012", "-o", str(out_file)]
            compile_cmd.extend([str(p) for p in hdl_paths])
            compile_cmd.append(str(tb_path))
            
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=work_dir
            )
            
            if compile_result.returncode != 0:
                return {
                    'success': False,
                    'vcd_file': None,
                    'log': compile_result.stderr,
                    'errors': self._extract_errors(compile_result.stderr)
                }
            
            # Run simulation
            run_cmd = ["vvp", str(out_file)]
            run_result = subprocess.run(
                run_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=work_dir
            )
            
            log = compile_result.stdout + compile_result.stderr + run_result.stdout + run_result.stderr
            
            # Find VCD file
            vcd_files = list(work_dir.glob("*.vcd"))
            vcd_file = vcd_files[0] if vcd_files else None
            
            return {
                'success': run_result.returncode == 0,
                'vcd_file': str(vcd_file) if vcd_file else None,
                'log': log,
                'errors': self._extract_errors(log)
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'vcd_file': None,
                'log': f"Simulation timeout after {timeout}s",
                'errors': ["Simulation timeout"]
            }
        except Exception as e:
            return {
                'success': False,
                'vcd_file': None,
                'log': str(e),
                'errors': [str(e)]
            }
    
    def _simulate_verilator(
        self,
        hdl_paths: List[Path],
        tb_path: Path,
        work_dir: Path,
        timeout: int
    ) -> Dict[str, Any]:
        """Run simulation using Verilator"""
        try:
            # Verilator compilation
            compile_cmd = [
                "verilator",
                "--cc",
                "--exe",
                "--build",
                "-Wall",
                "--trace"
            ]
            compile_cmd.extend([str(p) for p in hdl_paths])
            compile_cmd.append(str(tb_path))
            
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=work_dir
            )
            
            if compile_result.returncode != 0:
                return {
                    'success': False,
                    'vcd_file': None,
                    'log': compile_result.stderr,
                    'errors': self._extract_errors(compile_result.stderr)
                }
            
            # Run executable
            exe_path = work_dir / "obj_dir" / "Vtestbench"
            if exe_path.exists():
                run_result = subprocess.run(
                    [str(exe_path)],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=work_dir
                )
                
                log = compile_result.stdout + compile_result.stderr + run_result.stdout + run_result.stderr
                
                # Find VCD file
                vcd_files = list(work_dir.glob("*.vcd"))
                vcd_file = vcd_files[0] if vcd_files else None
                
                return {
                    'success': run_result.returncode == 0,
                    'vcd_file': str(vcd_file) if vcd_file else None,
                    'log': log,
                    'errors': self._extract_errors(log)
                }
            else:
                return {
                    'success': False,
                    'vcd_file': None,
                    'log': "Executable not generated",
                    'errors': ["Verilator compilation did not produce executable"]
                }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'vcd_file': None,
                'log': f"Simulation timeout after {timeout}s",
                'errors': ["Simulation timeout"]
            }
        except Exception as e:
            return {
                'success': False,
                'vcd_file': None,
                'log': str(e),
                'errors': [str(e)]
            }
    
    def _extract_errors(self, log: str) -> List[str]:
        """Extract error messages from simulation log"""
        errors = []
        
        error_patterns = [
            r'error:(.+)',
            r'Error:(.+)',
            r'ERROR:(.+)',
            r'%Error:(.+)',
            r'fatal:(.+)',
        ]
        
        for pattern in error_patterns:
            matches = re.findall(pattern, log, re.IGNORECASE)
            errors.extend([m.strip() for m in matches])
        
        return errors
    
    def parse_vcd(self, vcd_path: str) -> Dict[str, Any]:
        """
        Parse VCD file to extract waveforms
        
        Returns:
            Dict with:
                - 'signals': List of signal names
                - 'waveforms': Dict[signal_name, List[values]]
                - 'time': List[time_points]
        """
        try:
            import vcdvcd
            vcd = vcdvcd.VCDVCD(vcd_path)
            
            signals = {}
            time_points = []
            
            for signal_name in vcd.signals:
                signal = vcd[signal_name]
                signals[signal_name] = {
                    'values': signal.tv,
                    'type': 'wire' if 'wire' in str(signal) else 'reg'
                }
            
            return {
                'signals': list(signals.keys()),
                'waveforms': signals,
                'time': time_points,
                'endtime': vcd.endtime if hasattr(vcd, 'endtime') else 0
            }
        except ImportError:
            print("Warning: vcdvcd not installed. Install with: pip install vcdvcd")
            return {'signals': [], 'waveforms': {}, 'time': []}
        except Exception as e:
            print(f"Error parsing VCD: {e}")
            return {'signals': [], 'waveforms': {}, 'time': []}


def run_hdl_simulation(
    hdl_files: List[str],
    testbench: str,
    simulator: str = "iverilog",
    timeout: int = 60
) -> Dict[str, Any]:
    """Convenience function to run HDL simulation"""
    sim = HDLSimulator(simulator)
    return sim.simulate(hdl_files, testbench, timeout=timeout)
