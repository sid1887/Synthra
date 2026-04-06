/**
 * Integration Tests for Phase C Components
 * Tests all 6 components with real backend API endpoints
 */
const API_BASE = 'http://localhost:3000/api';
const results = [];
// Helper function to make API calls
async function callAPI(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
// Helper to measure duration
async function measureCall(fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return [result, duration];
}
// Test 1: Advanced Simulation Component
async function testAdvancedSimulation() {
    console.log('\n🧪 Testing AdvancedSimulation Component...');
    try {
        const [data, duration] = await measureCall(() => callAPI('/advanced-simulation/transient?analysisId=sim-001&sampleCount=100'));
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            throw new Error('Invalid transient data structure');
        }
        results.push({
            component: 'AdvancedSimulation',
            endpoint: '/advanced-simulation/transient',
            status: 'PASS',
            message: `Received ${data.data.length} data points`,
            duration
        });
        console.log(`✅ PASS - ${data.data.length} transient points (${duration.toFixed(2)}ms)`);
    }
    catch (error) {
        results.push({
            component: 'AdvancedSimulation',
            endpoint: '/advanced-simulation/transient',
            status: 'FAIL',
            message: error.message,
            duration: 0
        });
        console.log(`❌ FAIL - ${error.message}`);
    }
}
// Test 2: Circuit Comparison Component
async function testCircuitComparison() {
    console.log('\n🧪 Testing CircuitComparison Component...');
    try {
        const [data, duration] = await measureCall(() => callAPI('/advanced-simulation/comparison?originalId=circuit-001&modifiedId=circuit-002'));
        if (!data.original || !data.modified || !data.comparison) {
            throw new Error('Invalid comparison data structure');
        }
        results.push({
            component: 'CircuitComparison',
            endpoint: '/advanced-simulation/comparison',
            status: 'PASS',
            message: `Comparison verdict: ${data.comparison.verdict}`,
            duration
        });
        console.log(`✅ PASS - Verdict: ${data.comparison.verdict} (${duration.toFixed(2)}ms)`);
    }
    catch (error) {
        results.push({
            component: 'CircuitComparison',
            endpoint: '/advanced-simulation/comparison',
            status: 'FAIL',
            message: error.message,
            duration: 0
        });
        console.log(`❌ FAIL - ${error.message}`);
    }
}
// Test 3: Parameter Sweep Component
async function testParameterSweep() {
    console.log('\n🧪 Testing ParameterSweep Component...');
    try {
        const [data, duration] = await measureCall(() => callAPI('/advanced-simulation/sweep?componentId=R1&parameterName=Resistance&start=1000&end=10000&steps=20'));
        if (!data.sweepData || !Array.isArray(data.sweepData)) {
            throw new Error('Invalid sweep data structure');
        }
        results.push({
            component: 'ParameterSweep',
            endpoint: '/advanced-simulation/sweep',
            status: 'PASS',
            message: `Sweep generated ${data.sweepData.length} points`,
            duration
        });
        console.log(`✅ PASS - ${data.sweepData.length} sweep points (${duration.toFixed(2)}ms)`);
    }
    catch (error) {
        results.push({
            component: 'ParameterSweep',
            endpoint: '/advanced-simulation/sweep',
            status: 'FAIL',
            message: error.message,
            duration: 0
        });
        console.log(`❌ FAIL - ${error.message}`);
    }
}
// Test 4: Scene 3D Component
async function testScene3D() {
    console.log('\n🧪 Testing Scene3D Component...');
    try {
        const [data, duration] = await measureCall(() => callAPI('/scene-3d/visualization?analysisId=scene-001&mode=power'));
        if (!data.nodes || !Array.isArray(data.nodes)) {
            throw new Error('Invalid 3D scene data structure');
        }
        results.push({
            component: 'Scene3D',
            endpoint: '/scene-3d/visualization',
            status: 'PASS',
            message: `Scene ready with ${data.nodes.length} nodes`,
            duration
        });
        console.log(`✅ PASS - ${data.nodes.length} nodes rendered (${duration.toFixed(2)}ms)`);
    }
    catch (error) {
        results.push({
            component: 'Scene3D',
            endpoint: '/scene-3d/visualization',
            status: 'FAIL',
            message: error.message,
            duration: 0
        });
        console.log(`❌ FAIL - ${error.message}`);
    }
}
// Test 5: Adaptive Explanation Component
async function testAdaptiveExplanation() {
    console.log('\n🧪 Testing AdaptiveExplanation Component...');
    try {
        const [data, duration] = await measureCall(() => callAPI('/ai-orchestration/explain?analysisId=analysis-001&expertiseLevel=intermediate'));
        if (!data.explanation || !data.keyPoints) {
            throw new Error('Invalid explanation data structure');
        }
        results.push({
            component: 'AdaptiveExplanation',
            endpoint: '/ai-orchestration/explain',
            status: 'PASS',
            message: `Generated explanation (${data.keyPoints.length} key points)`,
            duration
        });
        console.log(`✅ PASS - Explanation with ${data.keyPoints.length} points (${duration.toFixed(2)}ms)`);
    }
    catch (error) {
        results.push({
            component: 'AdaptiveExplanation',
            endpoint: '/ai-orchestration/explain',
            status: 'FAIL',
            message: error.message,
            duration: 0
        });
        console.log(`❌ FAIL - ${error.message}`);
    }
}
// Test 6: Automation Dashboard Component
async function testAutomationDashboard() {
    console.log('\n🧪 Testing AutomationDashboard Component...');
    try {
        const [data, duration] = await measureCall(() => callAPI('/automation-engine/dashboard?circuitId=circuit-001'));
        if (!data.rules || !Array.isArray(data.rules)) {
            throw new Error('Invalid automation data structure');
        }
        results.push({
            component: 'AutomationDashboard',
            endpoint: '/automation-engine/dashboard',
            status: 'PASS',
            message: `Dashboard loaded with ${data.rules.length} rules`,
            duration
        });
        console.log(`✅ PASS - ${data.rules.length} automation rules (${duration.toFixed(2)}ms)`);
    }
    catch (error) {
        results.push({
            component: 'AutomationDashboard',
            endpoint: '/automation-engine/dashboard',
            status: 'FAIL',
            message: error.message,
            duration: 0
        });
        console.log(`❌ FAIL - ${error.message}`);
    }
}
// Run all tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 PHASE C INTEGRATION TEST SUITE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`API Base: ${API_BASE}`);
    console.log(`Frontend Dev: http://localhost:5173`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    await testAdvancedSimulation();
    await testCircuitComparison();
    await testParameterSweep();
    await testScene3D();
    await testAdaptiveExplanation();
    await testAutomationDashboard();
    // Print summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n✅ PASSED: ${passed}/6`);
    console.log(`❌ FAILED: ${failed}/6`);
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`📈 Average: ${(totalDuration / 6).toFixed(2)}ms per endpoint\n`);
    // Detailed results table
    console.log('Component Integration Results:');
    console.log('─────────────────────────────────────────────────────────');
    results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        const status = result.status === 'PASS' ? 'PASS' : 'FAIL';
        console.log(`${icon} ${result.component.padEnd(25)} │ ${status.padEnd(4)} │ ${result.message.substring(0, 40).padEnd(40)} │ ${result.duration.toFixed(2)}ms`);
    });
    console.log('─────────────────────────────────────────────────────────\n');
    // Return success if all passed
    return failed === 0;
}
// Export for Node.js execution
if (typeof module !== 'undefined' && require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    });
}
export { runAllTests };
