// Manual Build Mode JavaScript

const API_URL = '/api/manual';
let selectedComponents = {
    cpu: null, motherboard: null, gpu: null, ram: null,
    cooler: null, storage: null, psu: null, case: null
};
let componentData = {};

const stepOrder = [
    'brand', 'cpu', 'motherboard', 'gpu', 'ram', 
    'cooler', 'storage', 'psu', 'case', 'done'
];

window.onload = () => {
    history.replaceState({stepIndex: 0, stepId: 'step-brand'}, '', '');
    updateUI('step-brand');
};

window.onpopstate = (event) => {
    if (event.state) {
        handleBackLogic(event.state.stepIndex, event.state.stepId);
    }
};

function goBack() {
    history.back();
}

function handleBackLogic(targetIndex, targetStepId) {
    const currentStepId = document.querySelector('.step.active').id;
    const currentIndex = stepOrder.indexOf(currentStepId.replace('step-', ''));

    if (targetIndex < currentIndex) {
        for (let i = currentIndex; i > targetIndex; i--) {
            const compKey = stepOrder[i];
            if (selectedComponents[compKey] !== undefined) {
                selectedComponents[compKey] = null;
            }
        }
        updateSidebar();
    }
    
    updateUI(targetStepId);
}

function updateUI(stepId) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
    
    const name = stepId.replace('step-', '');
    const titleEl = document.getElementById('page-title');
    if(name === 'brand') titleEl.innerText = 'Select Platform';
    else if(name === 'done') titleEl.innerText = 'Build Complete';
    else titleEl.innerText = 'Select ' + name.charAt(0).toUpperCase() + name.slice(1);

    const navId = 'nav-' + name;
    const navItems = document.querySelectorAll('.roadmap li');
    let passed = false;
    navItems.forEach(item => {
        item.classList.remove('active', 'completed');
        if (item.id === navId) { item.classList.add('active'); passed = true; }
        else if (!passed) { item.classList.add('completed'); }
    });
}

function navigateForward(nextStepId) {
    const nextIndex = stepOrder.indexOf(nextStepId.replace('step-', ''));
    history.pushState({stepIndex: nextIndex, stepId: nextStepId}, '', '');
    updateUI(nextStepId);
}

function updateSidebar() {
    let total = 0;
    const summaryEl = document.getElementById('build-summary');
    summaryEl.innerHTML = '';

    let hasItems = false;
    for (const key in selectedComponents) {
        const comp = selectedComponents[key];
        if (comp) {
            hasItems = true;
            total += parseFloat(comp.Price || 0);
            summaryEl.innerHTML += `
                <div class="summary-item">
                    <strong>${key.toUpperCase()}</strong>
                    <span>${comp.Name}</span>
                </div>`;
        }
    }
    if (!hasItems) summaryEl.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">Your build is empty</p>';
    document.getElementById('total-price').textContent = `$${total.toFixed(2)}`;
}

async function populateGrid(gridId, url, dataKey) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '<div class="loading-grid">Loading options...</div>';
    
    const key = gridId.replace('grid-', '');
    const nextBtn = document.getElementById(`${key}-next-btn`);
    if (nextBtn) nextBtn.disabled = true;

    try {
        const response = await fetch(url);
        const data = await response.json();
        componentData[dataKey] = data;
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<div class="loading-grid">No compatible items found</div>';
            return;
        }

        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'component-card';
            
            if (selectedComponents[dataKey] && selectedComponents[dataKey].id === item.id) {
                card.classList.add('selected');
                if (nextBtn) nextBtn.disabled = false;
            }

            card.onclick = () => handleCardClick(dataKey, index, card, nextBtn);

            card.innerHTML = `
                <div class="card-title">${item.Name}</div>
                <div class="card-details">
                    ${item.Socket ? `Socket: ${item.Socket}` : ''}
                    ${item.VRAM_GB ? ` | ${item.VRAM_GB}GB` : ''}
                    ${item.TDP ? ` | ${item.TDP}W` : ''}
                </div>
                <div class="card-price">$${item.Price || 'N/A'}</div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="loading-grid error-text">Error loading data</div>';
    }
}

function handleCardClick(key, index, cardElement, nextBtn) {
    const grid = cardElement.parentElement;
    grid.querySelectorAll('.component-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    selectedComponents[key] = componentData[key][index];
    if (nextBtn) nextBtn.disabled = false;
    updateSidebar();
}

function selectBrand(brand) {
    document.getElementById('btn-intel').classList.remove('selected');
    document.getElementById('btn-amd').classList.remove('selected');
    document.getElementById(`btn-${brand.toLowerCase()}`).classList.add('selected');
    
    selectedComponents = { cpu: null, motherboard: null, gpu: null, ram: null, cooler: null, storage: null, psu: null, case: null };
    updateSidebar();

    populateGrid('grid-cpu', `${API_URL}/cpus?brand=${brand}`, 'cpu');
    navigateForward('step-cpu');
}

function selectCPU() {
    populateGrid('grid-motherboard', `${API_URL}/motherboards?socket=${selectedComponents.cpu.Socket}`, 'motherboard');
    populateGrid('grid-cooler', `${API_URL}/coolers?socket=${selectedComponents.cpu.Socket}`, 'cooler');
    navigateForward('step-motherboard');
}

function selectMotherboard() {
    populateGrid('grid-gpu', `${API_URL}/gpus`, 'gpu');
    populateGrid('grid-ram', `${API_URL}/ram?ram_type=${selectedComponents.motherboard.RAM_Type}`, 'ram');
    navigateForward('step-gpu');
}

function nextStepFrom(currentKey) {
    switch(currentKey) {
        case 'cpu': selectCPU(); break;
        case 'motherboard': selectMotherboard(); break;
        case 'gpu': navigateForward('step-ram'); break;
        case 'ram': navigateForward('step-cooler'); break;
        case 'cooler':
            populateGrid('grid-storage', `${API_URL}/storage`, 'storage');
            navigateForward('step-storage');
            break;
        case 'storage':
            populateGrid('grid-psu', `${API_URL}/psus`, 'psu');
            navigateForward('step-psu');
            break;
        case 'psu':
            const gpuLength = selectedComponents.gpu ? (selectedComponents.gpu.Length_cm || 0) : 0;
            populateGrid('grid-case', 
                `${API_URL}/cases?form_factor=${selectedComponents.motherboard.Form_Factor}&gpu_length=${gpuLength}`, 
                'case');
            navigateForward('step-case');
            break;
    }
}

function finishBuild() {
    navigateForward('step-done');
    validateBuild();
}

async function validateBuild() {
    const resultDiv = document.getElementById('validation-result');
    resultDiv.innerHTML = '<p style="text-align:center; color:#666;">Checking compatibility...</p>';

    try {
        const response = await fetch(`${API_URL}/validate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(selectedComponents) 
        });
        const result = await response.json();
        
        let html = '';
        if (result.isValid) {
            html += '<h3 class="success-text">✅ Build is Compatible!</h3><p>All components fit together perfectly.</p>';
        } else {
            html += '<h3 class="error-text">❌ Issues Found:</h3><ul>' + result.errors.map(err => `<li class="error-text">${err}</li>`).join('') + '</ul>';
        }
        if (result.warnings && result.warnings.length > 0) {
            html += '<h3 class="warning-text">⚠️ Warnings:</h3><ul>' + result.warnings.map(warn => `<li>${warn}</li>`).join('') + '</ul>';
        }
        
        let total = 0;
        for (const key in selectedComponents) if (selectedComponents[key]) total += selectedComponents[key].Price || 0;
        html += `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #eee;">
                    <h3>Total: <span class="success-text">$${total.toFixed(2)}</span></h3>
                 </div>`;

        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = '<p class="error-text">Server connection failed.</p>';
    }
}

function predictPerformance() {
    // Extract CPU and GPU names
    const cpuName = selectedComponents.cpu ? selectedComponents.cpu.Name : '';
    const gpuName = selectedComponents.gpu ? selectedComponents.gpu.Name : '';
    const ramName = selectedComponents.ram ? selectedComponents.ram.Name : '16GB';
    
    // Extract RAM GB (parse from name like "16GB DDR4")
    let ramGB = 16;
    const ramMatch = ramName.match(/(\d+)GB/);
    if (ramMatch) {
        ramGB = parseInt(ramMatch[1]);
    }
    
    // Store in sessionStorage and redirect
    sessionStorage.setItem('buildData', JSON.stringify({
        cpu: cpuName,
        gpu: gpuName,
        ram: ramGB,
        fromManual: true
    }));
    
    window.location.href = '/performance-predict';
}
