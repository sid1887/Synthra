import React, { useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';

interface SimulationParams {
  duration: number;
  stepSize: number;
  temperature: number;
  voltage: number;
}

interface SimulationPanelProps {
  isRunning?: boolean;
  isPaused?: boolean;
  progress?: number;
  params?: SimulationParams;
  onStart?: (params: SimulationParams) => void;
  onPause?: () => void;
  onStop?: () => void;
  onParamsChange?: (params: SimulationParams) => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  isRunning = false,
  isPaused = false,
  progress = 0,
  params = {
    duration: 10000,
    stepSize: 0.1,
    temperature: 25,
    voltage: 5,
  },
  onStart,
  onPause,
  onStop,
  onParamsChange,
}) => {
  const [localParams, setLocalParams] = useState<SimulationParams>(params);

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    const updated = { ...localParams, [key]: value };
    setLocalParams(updated);
    onParamsChange?.(updated);
  };

  return (
    <div className="simulation-panel">
      {/* Control Buttons */}
      <div className="simulation-controls">
        <Button
          size="md"
          variant={isRunning ? 'danger' : 'primary'}
          icon={isRunning ? <Square size={16} /> : <Play size={16} />}
          onClick={() => (isRunning ? onStop?.() : onStart?.(localParams))}
          disabled={false}
        >
          {isRunning ? 'Stop' : 'Start'}
        </Button>

        {isRunning && (
          <Button
            size="md"
            variant="secondary"
            icon={<Pause size={16} />}
            onClick={onPause}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="simulation-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{progress.toFixed(1)}%</span>
        </div>
      )}

      {/* Parameters */}
      <div className="simulation-params">
        <h4 className="params-title">Simulation Parameters</h4>

        <div className="param-group">
          <Input
            label="Duration (ms)"
            type="number"
            value={localParams.duration}
            onChange={(e) =>
              handleParamChange(
                'duration',
                parseFloat(e.target.value) || localParams.duration
              )
            }
            disabled={isRunning}
          />
        </div>

        <div className="param-group">
          <Input
            label="Step Size (μs)"
            type="number"
            value={localParams.stepSize}
            onChange={(e) =>
              handleParamChange(
                'stepSize',
                parseFloat(e.target.value) || localParams.stepSize
              )
            }
            disabled={isRunning}
            step="0.01"
          />
        </div>

        <div className="param-group">
          <Input
            label="Temperature (°C)"
            type="number"
            value={localParams.temperature}
            onChange={(e) =>
              handleParamChange(
                'temperature',
                parseFloat(e.target.value) || localParams.temperature
              )
            }
            disabled={isRunning}
          />
        </div>

        <div className="param-group">
          <Input
            label="Supply Voltage (V)"
            type="number"
            value={localParams.voltage}
            onChange={(e) =>
              handleParamChange(
                'voltage',
                parseFloat(e.target.value) || localParams.voltage
              )
            }
            disabled={isRunning}
            step="0.1"
          />
        </div>
      </div>

      {/* Analysis Options */}
      <div className="simulation-options">
        <h4 className="options-title">Analysis Type</h4>

        <div className="option-buttons">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => console.log('Transient')}
            disabled={isRunning}
          >
            Transient
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => console.log('AC')}
            disabled={isRunning}
          >
            AC Sweep
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => console.log('DC')}
            disabled={isRunning}
          >
            DC Sweep
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
