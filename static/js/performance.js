// Performance Prediction JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get build data from sessionStorage
    const buildDataStr = sessionStorage.getItem('buildData');
    
    if (!buildDataStr) {
        alert('No build data found. Please select a build first.');
        window.location.href = '/';
        return;
    }
    
    const buildData = JSON.parse(buildDataStr);
    
    // Display build components
    document.getElementById('display-cpu').textContent = buildData.cpu || '-';
    document.getElementById('display-gpu').textContent = buildData.gpu || '-';
    document.getElementById('display-ram').textContent = buildData.ram ? `${buildData.ram}GB` : '-';
    
    // Show loading
    document.getElementById('loading').classList.remove('hidden');
    
    // Call prediction API
    predictPerformance(buildData.cpu, buildData.gpu, buildData.ram);
});

async function predictPerformance(cpu, gpu, ram) {
    try {
        const response = await fetch('/api/performance/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpu: cpu,
                gpu: gpu,
                ram: ram
            })
        });
        
        const data = await response.json();
        
        // Hide loading
        document.getElementById('loading').classList.add('hidden');
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        displayResults(data);
        
    } catch (error) {
        document.getElementById('loading').classList.add('hidden');
        alert('Error connecting to server: ' + error.message);
    }
}

function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const bottleneckSummary = document.getElementById('bottleneckSummary');
    const cardsContainer = document.getElementById('cardsContainer');
    
    // Show results section
    resultsSection.classList.remove('hidden');
    
    // Display bottleneck summary
    const bottleneck = data.results[0]; // Using 1080p as baseline
    let bottleneckColor = '#28a745';
    let bottleneckStatus = 'Excellent';
    
    if (bottleneck.bottleneck_pct > 20) {
        bottleneckColor = '#ffc107';
        bottleneckStatus = 'Moderate';
    }
    if (bottleneck.bottleneck_pct > 40) {
        bottleneckColor = '#dc3545';
        bottleneckStatus = 'Significant';
    }
    
    bottleneckSummary.innerHTML = `
        <h3 style="margin-bottom: 15px;">System Bottleneck Analysis</h3>
        <div style="font-size: 3rem; color: ${bottleneckColor}; margin: 20px 0;">
            ${bottleneck.bottleneck_pct}%
        </div>
        <p style="font-size: 1.2rem; color: #666;">
            ${bottleneckStatus} Balance | Bottleneck: <strong>${bottleneck.bottleneck_type}</strong>
        </p>
        <p style="margin-top: 10px; color: #888;">
            Total Score: ${data.build_info.total_score}
        </p>
    `;
    
    // Display performance cards for each resolution
    cardsContainer.innerHTML = '';
    
    data.results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'performance-card';
        
        let fpsColor = '#28a745';
        if (result.fps < 60) fpsColor = '#dc3545';
        else if (result.fps < 100) fpsColor = '#ffc107';
        
        card.innerHTML = `
            <h3>📺 ${result.resolution.toUpperCase()}</h3>
            <div class="metric">
                <span class="label">🎮 FPS</span>
                <span class="value" style="color: ${fpsColor};">${result.fps}</span>
            </div>
            <div class="metric">
                <span class="label">⭐ Gaming Rating</span>
                <span class="value">${result.gaming_rating}</span>
            </div>
            <div class="metric">
                <span class="label">📊 Suitability Score</span>
                <span class="value">${result.suitability_score}%</span>
            </div>
            <div class="metric">
                <span class="label">🔧 Bottleneck</span>
                <span class="value">${result.bottleneck_pct}% (${result.bottleneck_type})</span>
            </div>
        `;
        
        cardsContainer.appendChild(card);
    });
}
