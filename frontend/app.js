const elements = {
  fileInput: document.querySelector("#fileInput"),
  cameraInput: document.querySelector("#cameraInput"),
  dropzone: document.querySelector("#dropzone"),
  analyzeBtn: document.querySelector("#analyzeBtn"),
  tryAnotherBtn: document.querySelector("#tryAnotherBtn"),
  retakeBtn: document.querySelector("#retakeBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  threshold: document.querySelector("#threshold"),
  thresholdValue: document.querySelector("#thresholdValue"),
  preview: document.querySelector("#preview"),
  progress: document.querySelector("#progress"),
  qualityPrompts: document.querySelector("#qualityPrompts"),
  stateEmpty: document.querySelector("#stateEmpty"),
  stateLoading: document.querySelector("#stateLoading"),
  stateError: document.querySelector("#stateError"),
  resultContent: document.querySelector("#resultContent"),
  circuitLabel: document.querySelector("#circuitLabel"),
  circuitConfidence: document.querySelector("#circuitConfidence"),
  componentList: document.querySelector("#componentList"),
  explanationText: document.querySelector("#explanationText"),
  annotationCanvas: document.querySelector("#annotationCanvas"),
  schematicSvg: document.querySelector("#schematicSvg"),
  schematicStatus: document.querySelector("#schematicStatus"),
  simulationStatus: document.querySelector("#simulationStatus"),
  simulationComponents: document.querySelector("#simulationComponents"),
  warningsList: document.querySelector("#warningsList"),
  suggestionsList: document.querySelector("#suggestionsList"),
  fixList: document.querySelector("#fixList"),
  historyList: document.querySelector("#historyList")
};

const state = {
  selectedFile: null,
  lastResponse: null,
  history: loadHistory()
};

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("synthra-history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem("synthra-history", JSON.stringify(state.history.slice(0, 12)));
}

function setProgress(text) {
  elements.progress.textContent = `State: ${text}`;
}

function setAppState(view) {
  elements.stateEmpty.classList.toggle("hidden", view !== "empty");
  elements.stateLoading.classList.toggle("hidden", view !== "loading");
  elements.stateError.classList.toggle("hidden", view !== "error");
  elements.resultContent.classList.toggle("hidden", view !== "done");
}

function renderPreview(file) {
  if (!file) {
    elements.preview.classList.add("empty");
    elements.preview.textContent = "No image selected";
    return;
  }

  const url = URL.createObjectURL(file);
  elements.preview.classList.remove("empty");
  elements.preview.innerHTML = "";

  const img = document.createElement("img");
  img.alt = "Uploaded circuit preview";
  img.src = url;

  elements.preview.appendChild(img);
}

function renderList(element, values, fallback = "None") {
  element.innerHTML = "";
  if (!values || values.length === 0) {
    const li = document.createElement("li");
    li.textContent = fallback;
    element.appendChild(li);
    return;
  }

  for (const value of values) {
    const li = document.createElement("li");
    li.textContent = value;
    element.appendChild(li);
  }
}

function renderQualityPrompts(quality) {
  elements.qualityPrompts.innerHTML = "";
  if (!quality) return;

  if (quality.blurry) {
    const p = document.createElement("p");
    p.textContent = "Move closer and stabilize the camera.";
    elements.qualityPrompts.appendChild(p);
  }
  if (quality.dark) {
    const p = document.createElement("p");
    p.textContent = "Increase lighting to improve detection.";
    elements.qualityPrompts.appendChild(p);
  }
  if (quality.anglePoor) {
    const p = document.createElement("p");
    p.textContent = "Try a top-down angle for clearer wiring.";
    elements.qualityPrompts.appendChild(p);
  }
}

function renderHistory() {
  elements.historyList.innerHTML = "";
  for (const entry of state.history.slice(0, 8)) {
    const li = document.createElement("li");
    li.textContent = `${entry.timestamp} - ${entry.circuit} (${entry.confidence})`;
    elements.historyList.appendChild(li);
  }
}

function renderAnnotations(data) {
  const canvas = elements.annotationCanvas;
  const img = elements.preview.querySelector("img");

  console.log("[Synthra] Rendering annotations. Canvas:", canvas, "Img:", img);

  if (!img || !data.image || !data.components) {
    canvas.width = 0;
    canvas.height = 0;
    console.warn("[Synthra] Skipping annotations: missing image or components");
    return;
  }

  canvas.width = img.naturalWidth || img.width || 600;
  canvas.height = img.naturalHeight || img.height || 400;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("[Synthra] Failed to get canvas context");
    return;
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  console.log("[Synthra] Drew image on canvas. Components count:", data.components.length);

  const colors = {
    resistor: "#f59e0b",
    led: "#ef4444",
    battery: "#22c55e",
    switch: "#3b82f6",
    diode: "#a855f7",
    capacitor: "#14b8a6",
    transistor: "#f97316",
    wire: "#64748b",
    unknown: "#9ca3af"
  };

  for (const component of data.components) {
    const bbox = component.bbox || {};
    const scaleX = canvas.width / data.image.width;
    const scaleY = canvas.height / data.image.height;

    const x = (bbox.x || 0) * scaleX;
    const y = (bbox.y || 0) * scaleY;
    const w = (bbox.w || 50) * scaleX;
    const h = (bbox.h || 50) * scaleY;

    const color = colors[component.canonicalLabel] || "#9ca3af";

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    const label = `${component.canonicalLabel} (${(component.confidence * 100).toFixed(0)}%)`;
    ctx.fillStyle = color;
    ctx.font = "12px monospace";
    ctx.fillText(label, x + 4, y + 16);
  }
}

function renderSchematic(data) {
  const svg = elements.schematicSvg;
  svg.innerHTML = "";

  if (!data.reconstruction || !data.reconstruction.nodes) {
    elements.schematicStatus.textContent = "No schematic data available";
    return;
  }

  const recon = data.reconstruction;

  for (const node of recon.nodes) {
    const colors = {
      led: "red",
      resistor: "orange",
      battery: "green",
      switch: "blue",
      diode: "purple",
      capacitor: "teal",
      transistor: "lime",
      wire: "gray",
      unknown: "silver"
    };

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "node");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", node.x);
    rect.setAttribute("y", node.y);
    rect.setAttribute("width", node.width);
    rect.setAttribute("height", node.height);
    rect.setAttribute("fill", colors[node.label] || "silver");
    rect.setAttribute("stroke", "#000");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("rx", "4");
    g.appendChild(rect);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x + node.width / 2);
    text.setAttribute("y", node.y + node.height / 2 + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "11");
    text.setAttribute("fill", "white");
    text.setAttribute("font-weight", "bold");
    text.textContent = node.label.substring(0, 3).toUpperCase();
    g.appendChild(text);

    svg.appendChild(g);
  }

  for (const edge of recon.edges) {
    const fromNode = recon.nodes.find((n) => n.id === edge.from);
    const toNode = recon.nodes.find((n) => n.id === edge.to);

    if (!fromNode || !toNode) continue;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", fromNode.x + fromNode.width / 2);
    line.setAttribute("y1", fromNode.y + fromNode.height / 2);
    line.setAttribute("x2", toNode.x + toNode.width / 2);
    line.setAttribute("y2", toNode.y + toNode.height / 2);
    line.setAttribute("stroke", "#333");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  }

  elements.schematicStatus.textContent = `${recon.nodes.length} components, ${recon.edges.length} connections. Confidence: ${(recon.confidence * 100).toFixed(0)}%`;
}

function renderSimulation(data) {
  if (!data.simulation) {
    elements.simulationStatus.textContent = "No simulation data";
    return;
  }

  const sim = data.simulation;

  let statusHtml = `<strong>${sim.status.toUpperCase()}</strong> - ${sim.summary}<br/>`;
  if (sim.circuit_state) {
    statusHtml += `Circuit: ${sim.circuit_state} | `;
  }
  if (sim.path_current_amps !== undefined) {
    statusHtml += `Current: ${sim.path_current_amps}A | `;
  }
  if (sim.total_resistance_ohms !== undefined) {
    statusHtml += `Resistance: ${sim.total_resistance_ohms}Ω`;
  }
  if (sim.warning) {
    statusHtml += `<br/><strong style="color: #b45309;">${sim.warning}</strong>`;
  }

  elements.simulationStatus.innerHTML = statusHtml;

  const comps = sim.components_state || [];
  elements.simulationComponents.innerHTML = "";

  for (const comp of comps) {
    const li = document.createElement("li");
    let text = `<strong>${comp.type}</strong>`;

    if (comp.type === "resistor") {
      text += ` | ${comp.resistance}Ω | ${comp.current.toFixed(3)}A | ${comp.power.toFixed(3)}W`;
    } else if (comp.type === "led") {
      text += ` | ${comp.status} | brightness ${comp.brightness.toFixed(0)}%`;
    } else if (comp.type === "switch") {
      text += ` | ${comp.state}`;
    } else if (comp.type === "diode") {
      text += ` | ${comp.conduct ? "conducting" : "blocking"}`;
    }

    li.innerHTML = text;
    elements.simulationComponents.appendChild(li);
  }
}

function renderResponse(data) {
  elements.circuitLabel.textContent = data.circuit.label;
  elements.circuitConfidence.textContent = `confidence ${data.circuit.confidence}`;

  renderList(
    elements.componentList,
    data.components.map((c) => `${c.canonicalLabel} x${c.count} (${c.confidence.toFixed(2)})`)
  );

  elements.explanationText.textContent = data.explanation.student;

  renderAnnotations(data);
  renderSchematic(data);
  renderSimulation(data);

  renderList(elements.warningsList, data.warnings.map((w) => `${w.code}: ${w.message}`), "No warnings");
  renderList(elements.suggestionsList, data.suggestions.map((s) => s.message), "No suggestions");
  renderList(elements.fixList, data.fixes.map((f) => `${f.title} - ${f.reason}`), "No fixes");

  renderQualityPrompts(data.image.quality);
  setAppState("done");
  setProgress("done");

  state.history.unshift({
    timestamp: new Date().toLocaleTimeString(),
    circuit: data.circuit.label,
    confidence: data.circuit.confidence
  });
  saveHistory();
  renderHistory();
}

function pickFile(file) {
  state.selectedFile = file;
  renderPreview(file);
  setProgress("ready");
  if (file) {
    elements.progress.innerHTML = `<strong style="color: #0f766e;">Image ready!</strong> Click "Analyze Circuit" button or press Enter to analyze.`;
  }
}

async function analyze() {
  if (!state.selectedFile) {
    setAppState("error");
    elements.stateError.textContent = "Select an image before analysis.";
    console.error("[Synthra] No file selected");
    return;
  }

  setAppState("loading");
  setProgress("uploading");
  elements.stateError.textContent = "";
  console.log("[Synthra] Starting analysis...", state.selectedFile.name);

  try {
    const formData = new FormData();
    formData.append("image", state.selectedFile);
    formData.append("minConfidence", elements.threshold.value);

    setProgress("analyzing");
    console.log("[Synthra] Sending to API...");
    
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || "Analysis failed");
    }

    const data = await response.json();
    console.log("[Synthra] Analysis complete:", data);
    state.lastResponse = data;
    renderResponse(data);
  } catch (error) {
    console.error("[Synthra] Analysis error:", error);
    setAppState("error");
    setProgress("error");
    elements.stateError.textContent = error.message;
  }
}

function clearAnalysis() {
  state.selectedFile = null;
  state.lastResponse = null;
  elements.fileInput.value = "";
  elements.cameraInput.value = "";
  renderPreview(null);
  renderQualityPrompts(null);
  setAppState("empty");
  setProgress("idle");
}

elements.fileInput.addEventListener("change", (event) => pickFile(event.target.files?.[0]));
elements.cameraInput.addEventListener("change", (event) => pickFile(event.target.files?.[0]));
elements.analyzeBtn.addEventListener("click", analyze);
elements.tryAnotherBtn.addEventListener("click", clearAnalysis);
elements.retakeBtn.addEventListener("click", () => elements.cameraInput.click());
elements.clearBtn.addEventListener("click", clearAnalysis);

elements.threshold.addEventListener("input", () => {
  elements.thresholdValue.textContent = Number(elements.threshold.value).toFixed(2);
});

elements.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropzone.classList.add("drag");
});

elements.dropzone.addEventListener("dragleave", () => {
  elements.dropzone.classList.remove("drag");
});

elements.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropzone.classList.remove("drag");
  const file = event.dataTransfer?.files?.[0];
  if (file) pickFile(file);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && state.selectedFile) {
    analyze();
  }
});

renderHistory();
clearAnalysis();
console.log("[Synthra] Initialization complete. Ready for circuit analysis.");
