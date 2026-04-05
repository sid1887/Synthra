export async function analyzeImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.statusMessage || 'Analysis failed');
    }
    return response.json();
}
export async function getHistory() {
    const response = await fetch('/api/history');
    if (!response.ok)
        throw new Error('Failed to fetch history');
    const data = await response.json();
    return data.history;
}
export async function getAnalysis(id) {
    const response = await fetch(`/api/results/${id}`);
    if (!response.ok)
        throw new Error('Failed to fetch analysis');
    return response.json();
}
export async function exportAnalysis(id, format) {
    const response = await fetch(`/api/export/${id}/${format}`);
    if (!response.ok)
        throw new Error(`Failed to export to ${format}`);
    return response.blob();
}
export function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
