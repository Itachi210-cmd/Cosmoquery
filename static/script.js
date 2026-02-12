/**
 * CosmoQuery - Frontend (Connected to Flask API)
 */

const appState = {
    pagination: {
        currentPage: 1,
        itemsPerPage: 10
    },
    sorting: {
        column: null,
        direction: 'asc'
    }
};

const dom = {
    // Filters
    yearSelect: document.getElementById('discovery-year'),
    methodSelect: document.getElementById('discovery-method'),
    facilitySelect: document.getElementById('discovery-facility'),
    hostInput: document.getElementById('host-star'),
    clearBtn: document.getElementById('clear-btn'),
    searchBtn: document.getElementById('search-btn'),

    // Table Area
    tableBody: document.getElementById('exoplanet-table-body'),
    loadingIndicator: document.getElementById('loading-indicator'),

    // Pagination / Stats
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageDisplay: document.getElementById('page-display'),
    resultsInfo: document.getElementById('results-info'),
    totalCountDisplay: document.getElementById('total-count-display'),

    // Charts
    chartTrendsArea: document.getElementById('trends-chart-svg'),

    // Sorting
    sortHeaders: document.querySelectorAll('th[data-sort]')
};

// Initialize
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
    fetchData(); // Initial load

    // Add event listener to close modal on outside click
    const modal = document.getElementById('habitability-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'habitability-modal') closeHabitabilityModal();
        });
    }

    // Guide Modal Listener
    const guideModal = document.getElementById('type-guide-modal');
    if (guideModal) {
        guideModal.addEventListener('click', (e) => {
            if (e.target.id === 'type-guide-modal') toggleTypeGuide();
        });
    }

    setupEventListeners();
});

// --- TYPE GUIDE ---
function toggleTypeGuide() {
    const modal = document.getElementById('type-guide-modal');
    if (modal) {
        // Simple toggle logic
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
}

// --- HABITABILITY CALCULATOR ---
function calculateHabitability(planet) {
    let score = 0;
    let radius = parseFloat(planet.pl_rade);
    let flux = parseFloat(planet.pl_insol);
    let temp = parseFloat(planet.pl_eqt);
    let reasons = [];

    // 1. Radius Score (Max 40)
    // Preference for Earth-sized (0.8 - 1.5 EU)
    if (!isNaN(radius)) {
        if (radius >= 0.8 && radius <= 1.5) {
            score += 40;
            reasons.push("Perfect Size (Rocky)");
        } else if (radius > 1.5 && radius <= 2.5) {
            score += 20;
            reasons.push("Large, likely Super-Earth/Mini-Neptune");
        } else {
            reasons.push("Size is not ideal for life");
        }
    } else {
        reasons.push("Unknown Radius");
    }

    // 2. Flux Score (Max 30)
    // Goldilocks Zone (0.5 - 2.0 Earth Flux)
    if (!isNaN(flux)) {
        if (flux >= 0.5 && flux <= 2.0) {
            score += 30;
            reasons.push("In the Goldilocks Zone (Liquid Water Possible)");
        } else if (flux > 2.0) {
            reasons.push("Receives too much radiation");
        } else {
            reasons.push("Too cold (low stellar flux)");
        }
    } else {
        reasons.push("Unknown Stellar Flux");
    }

    // 3. Temperature Score (Max 30)
    // Habitable Range (200K - 320K)
    if (!isNaN(temp)) {
        if (temp >= 200 && temp <= 320) {
            score += 30;
            reasons.push("Surface temperature could support liquid water");
        } else if (temp > 320) {
            let penalty = Math.min(30, (temp - 320) / 10); // Penalty for heat
            score += Math.max(0, 30 - penalty);
            reasons.push("Likely too hot");
        } else {
            reasons.push("Likely frozen");
        }
    } else {
        // Auto-bonus if Flux was good but Temp is missing (common scenario)
        if (!isNaN(flux) && flux >= 0.5 && flux <= 2.0) score += 15;
    }

    let label = "Dead World";
    let color = "text-red-500";

    if (score >= 80) { label = "Earth-Like Candidate"; color = "text-green-400"; }
    else if (score >= 50) { label = "Potentially Habitable"; color = "text-yellow-400"; }
    else if (score >= 30) { label = "Extreme Environment"; color = "text-orange-500"; }

    return { score, label, color, reasons };
}

function showHabitabilityModal(planet) {
    const analysis = calculateHabitability(planet);
    const modal = document.getElementById('habitability-modal');

    if (!modal) return;

    document.getElementById('modal-planet-name').textContent = planet.pl_name;
    document.getElementById('modal-score').textContent = analysis.score + "/100";
    document.getElementById('modal-score').className = `text-6xl font-bold mb-2 ${analysis.color}`;
    document.getElementById('modal-label').textContent = analysis.label;
    document.getElementById('modal-label').className = `text-xl uppercase tracking-widest ${analysis.color}`;

    const reasonsList = document.getElementById('modal-reasons');
    reasonsList.innerHTML = '';
    analysis.reasons.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r;
        li.className = "text-slate-300";
        reasonsList.appendChild(li);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeHabitabilityModal() {
    const modal = document.getElementById('habitability-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function setupEventListeners() {
    const debouncedFilter = debounce(() => {
        appState.pagination.currentPage = 1;
        fetchData();
    }, 500);

    if (dom.yearSelect) dom.yearSelect.addEventListener('change', debouncedFilter);
    if (dom.methodSelect) dom.methodSelect.addEventListener('change', debouncedFilter);
    if (dom.facilitySelect) dom.facilitySelect.addEventListener('change', debouncedFilter);
    if (dom.hostInput) dom.hostInput.addEventListener('input', debouncedFilter);

    if (dom.clearBtn) dom.clearBtn.addEventListener('click', clearFilters);
    if (dom.searchBtn) dom.searchBtn.addEventListener('click', () => {
        appState.pagination.currentPage = 1;
        fetchData();
    });

    if (dom.prevBtn) dom.prevBtn.addEventListener('click', () => changePage(-1));
    if (dom.nextBtn) dom.nextBtn.addEventListener('click', () => changePage(1));

    dom.sortHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (appState.sorting.column === col) {
                appState.sorting.direction = appState.sorting.direction === 'asc' ? 'desc' : 'asc';
            } else {
                appState.sorting.column = col;
                appState.sorting.direction = 'asc';
            }
            fetchData();
        });
    });
}

async function loadFilters() {
    try {
        const res = await fetch('/api/filters');
        const data = await res.json();

        populateSelect(dom.yearSelect, data.years);
        populateSelect(dom.methodSelect, data.methods);
        populateSelect(dom.facilitySelect, data.facilities);
    } catch (err) {
        console.error("Failed to load filters", err);
    }
}

async function fetchData() {
    if (dom.loadingIndicator) dom.loadingIndicator.style.display = 'inline-block';

    // Build Query Params
    const params = new URLSearchParams({
        page: appState.pagination.currentPage,
        per_page: appState.pagination.itemsPerPage
    });

    if (dom.yearSelect && dom.yearSelect.value) params.append('year', dom.yearSelect.value);
    if (dom.methodSelect && dom.methodSelect.value) params.append('method', dom.methodSelect.value);
    if (dom.facilitySelect && dom.facilitySelect.value) params.append('facility', dom.facilitySelect.value);
    if (dom.hostInput && dom.hostInput.value) params.append('host', dom.hostInput.value);

    if (appState.sorting.column) {
        params.append('sort_col', appState.sorting.column);
        params.append('sort_dir', appState.sorting.direction);
    }

    try {
        // Parallel requests: Data for table, Stats for charts
        const [dataRes, statsRes] = await Promise.all([
            fetch(`/api/data?${params.toString()}`),
            fetch(`/api/stats?${params.toString()}`) // Send same filters to stats
        ]);

        const data = await dataRes.json();
        const stats = await statsRes.json();

        renderTable(data);
        renderCharts(stats);

    } catch (err) {
        console.error("Fetch error:", err);
        dom.tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Error loading data. Is the Flask server running?</td></tr>`;
    } finally {
        if (dom.loadingIndicator) dom.loadingIndicator.style.display = 'none';
    }
}

let currentPageData = []; // Store current page data for comparison tool lookup

function renderTable(response) {
    if (!dom.tableBody) return;
    dom.tableBody.innerHTML = '';

    const { data, total, page, pages } = response;
    currentPageData = data; // Update global reference

    // Update Stats UI
    if (dom.totalCountDisplay) dom.totalCountDisplay.innerText = total.toLocaleString();
    if (dom.resultsInfo) dom.resultsInfo.innerText = `Showing ${data.length} of ${total.toLocaleString()} Objects`;
    if (dom.pageDisplay) dom.pageDisplay.innerText = `Page ${page} of ${pages}`;

    if (dom.prevBtn) dom.prevBtn.disabled = page === 1;
    if (dom.nextBtn) dom.nextBtn.disabled = page === pages || pages === 0;

    data.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition-colors group border-b border-white/5';

        const isSelected = selectedPlanets.some(sp => sp.pl_name === p.pl_name);

        let methodClass = "bg-secondary/20 text-secondary";
        if (p.discoverymethod && p.discoverymethod.includes("Radial")) methodClass = "bg-blue-500/20 text-blue-400";
        if (p.discoverymethod && p.discoverymethod.includes("Imaging")) methodClass = "bg-green-500/20 text-green-400";

        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-white flex items-center gap-3">
                <input type="checkbox" 
                    onchange="togglePlanetSelection('${p.pl_name}')" 
                    ${isSelected ? 'checked' : ''}
                    class="form-checkbox bg-transparent border-slate-500 text-primary rounded focus:ring-0 cursor-pointer w-4 h-4">
                
                <a href="#" onclick='showHabitabilityModal(${JSON.stringify(p)}); return false;' class="hover:text-primary transition-colors text-sm font-bold">
                    ${p.pl_name}
                </a>
            </td>
            <td class="px-6 py-4 text-slate-300 text-xs font-bold uppercase tracking-wider">${p.hostname}</td>
            <td class="px-6 py-4 text-center text-slate-300">${p.pl_bmassj || '-'}</td>
            <td class="px-6 py-4 text-center text-slate-300">
                ${p.pl_radj ? p.pl_radj : '-'}
                 ${p.pl_rade ? `<span class="block text-[10px] text-slate-500">(${p.pl_rade} R⊕)</span>` : ''}
            </td>
            <td class="px-6 py-4 text-center text-slate-300">${p.pl_orbper || '-'}</td>
            <td class="px-6 py-4 text-slate-400 text-xs">
                 <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/5 ${methodClass}">
                    ${p.discoverymethod}
                 </span>
            </td>
            <td class="px-6 py-4 text-slate-400 text-xs truncate max-w-[150px]" title="${p.disc_facility}">${p.disc_facility}</td>
            <td class="px-6 py-4 text-right font-bold text-white text-xs">${p.disc_year}</td>
        `;
        dom.tableBody.appendChild(row);
    });

    // --- RENDER MOBILE CARDS ---
    const mobileCards = document.getElementById('mobile-cards');
    if (mobileCards) {
        mobileCards.innerHTML = data.map(p => {
            let methodClass = "bg-secondary/20 text-secondary";
            if (p.discoverymethod && p.discoverymethod.includes("Radial")) methodClass = "bg-blue-500/20 text-blue-400";
            if (p.discoverymethod && p.discoverymethod.includes("Imaging")) methodClass = "bg-green-500/20 text-green-400";

            return `
            <div class="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-white mb-1 flex items-center gap-2">
                            ${p.pl_name}
                             <a href="#" onclick='showHabitabilityModal(${JSON.stringify(p)}); return false;' class="text-slate-400 hover:text-primary material-symbols-outlined text-sm">
                                science
                            </a>
                        </div>
                        <div class="text-xs text-slate-400">${p.hostname}</div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                         <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${methodClass}">
                            ${p.discoverymethod}
                         </span>
                         <span class="text-[10px] text-slate-500">${p.disc_year}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 text-center py-3 border-y border-white/5">
                    <div>
                        <div class="text-[10px] text-slate-500 uppercase">Mass</div>
                        <div class="font-medium text-sm">${p.pl_bmassj || '-'} <span class="text-xs text-slate-500">M<sub>J</sub></span></div>
                    </div>
                    <div>
                         <div class="text-[10px] text-slate-500 uppercase">Radius</div>
                        <div class="font-medium text-sm">${p.pl_radj || '-'} <span class="text-xs text-slate-500">R<sub>J</sub></span></div>
                    </div>
                    <div>
                         <div class="text-[10px] text-slate-500 uppercase">Period</div>
                        <div class="font-medium text-sm">${p.pl_orbper || '-'} <span class="text-xs text-slate-500">d</span></div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-1">
                    <span class="text-xs text-slate-400 truncate max-w-[150px]">${p.disc_facility}</span>
                    <button onclick="togglePlanetSelection('${p.pl_name}')" class="text-xs text-primary font-bold uppercase tracking-wider hover:text-white transition-colors">
                        ${selectedPlanets.some(sp => sp.pl_name === p.pl_name) ? 'Remove' : 'Compare'}
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }
}

function renderCharts(stats) {
    // Trends (Decades)
    const trends = stats.trends || {};
    const counts = [
        trends["1990.0"] || trends[1990] || 0,
        trends["2000.0"] || trends[2000] || 0,
        trends["2010.0"] || trends[2010] || 0,
        trends["2020.0"] || trends[2020] || 0
    ];

    const maxVal = Math.max(...counts, 10);
    const points = counts.map((count, index) => {
        const x = 100 + (index * 100);
        const y = 180 - ((count / maxVal) * 150);
        return `${x},${y}`;
    });

    const areaPath = `M0,180 L${points.join(' L')} L500,180 V200 H0 Z`;
    const linePath = `M0,180 L${points.join(' L')} L500,180`;

    const svg = dom.chartTrendsArea;
    if (svg) {
        const paths = svg.querySelectorAll('path');
        if (paths[0]) paths[0].setAttribute('d', areaPath);
        if (paths[1]) paths[1].setAttribute('d', linePath);

        const circles = svg.querySelectorAll('circle');
        circles.forEach((circle, i) => {
            if (i < points.length && points[i]) {
                const [cx, cy] = points[i].split(',');
                circle.setAttribute('cx', cx);
                circle.setAttribute('cy', cy);
            }
        });
    }
}

function populateSelect(element, options) {
    if (!element || !options) return;
    const first = element.options[0];
    element.innerHTML = '';
    element.appendChild(first);

    options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        element.appendChild(o);
    });
}

function clearFilters() {
    if (dom.yearSelect) dom.yearSelect.value = '';
    if (dom.methodSelect) dom.methodSelect.value = '';
    if (dom.facilitySelect) dom.facilitySelect.value = '';
    if (dom.hostInput) dom.hostInput.value = '';
    appState.pagination.currentPage = 1;
    fetchData();
}

function changePage(delta) {
    appState.pagination.currentPage += delta;
    fetchData();
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- COMPARISON TOOL LOGIC ---
let selectedPlanets = [];

function togglePlanetSelection(planetName) {
    // Try to find in current page data first
    let planet = currentPageData.find(p => p.pl_name === planetName);

    // If not in current page (maybe checking existing selection), check selected array
    if (!planet) {
        planet = selectedPlanets.find(p => p.pl_name === planetName);
    }

    if (!planet) return; // Should not happen if triggered from UI

    const index = selectedPlanets.findIndex(p => p.pl_name === planetName);

    if (index === -1) {
        if (selectedPlanets.length >= 3) {
            alert("You can compare up to 3 planets at a time.");
            // Uncheck the box visually
            renderTable({ data: currentPageData, total: 39282, page: appState.pagination.currentPage, pages: 100 }); // Hacky re-render to reset checkbox?
            // Actually, calling renderTable might be too heavy. 
            // Better to let the user uncheck manually or just alert.
            // But we need to uncheck the box that was just checked.
            setTimeout(() => {
                const checkbox = document.querySelector(`input[onchange="togglePlanetSelection('${planetName}')"]`);
                if (checkbox) checkbox.checked = false;
            }, 0);
            return;
        }
        selectedPlanets.push(planet);
    } else {
        selectedPlanets.splice(index, 1);
    }

    updateComparisonUI();
    // No need to re-render entire table, just updating global state is enough
    // The checkbox state is already toggled by user interaction
}

function updateComparisonUI() {
    const bar = document.getElementById('comparison-bar');
    const countSpan = document.getElementById('compare-count');

    if (bar && countSpan) {
        countSpan.textContent = selectedPlanets.length;
        if (selectedPlanets.length > 0) {
            bar.classList.remove('translate-y-24'); // Slide up
        } else {
            bar.classList.add('translate-y-24'); // Slide down
        }
    }
}

function clearComparisonSelection() {
    selectedPlanets = [];
    updateComparisonUI();
    renderTable({ data: currentPageData, total: parseInt(dom.totalCountDisplay.innerText.replace(/,/g, '')), page: appState.pagination.currentPage, pages: parseInt(dom.pageDisplay.innerText.split(' of ')[1]) });
}

function openComparisonModal() {
    const modal = document.getElementById('comparison-modal');
    const grid = document.getElementById('comparison-grid');

    if (!modal || !grid) return;

    grid.innerHTML = '';

    selectedPlanets.forEach(p => {
        const analysis = calculateHabitability(p);

        const card = document.createElement('div');
        card.className = "bg-white/5 rounded-xl border border-white/5 p-6 flex flex-col gap-4";
        card.innerHTML = `
            <div class="text-center pb-4 border-b border-white/10">
                <h3 class="text-2xl font-bold text-white mb-1">${p.pl_name}</h3>
                <span class="text-xs uppercase tracking-widest font-bold ${analysis.color}">${analysis.label}</span>
            </div>
            
            <div class="space-y-4 text-sm">
                <div class="flex justify-between items-center">
                    <span class="text-slate-400">Radius</span>
                    <span class="text-white font-bold">${p.pl_rade || '?'} R⊕</span>
                </div>
                <!-- Visual Bar for Radius (Relative to Earth=1) -->
                 <div class="w-full bg-white/10 rounded-full h-1.5 mt-1">
                    <div class="bg-primary h-1.5 rounded-full" style="width: ${Math.min(100, (parseFloat(p.pl_rade) || 0) * 10)}%"></div>
                </div>

                <div class="flex justify-between items-center pt-2">
                    <span class="text-slate-400">Mass</span>
                    <span class="text-white font-bold">${p.pl_bmassj ? (p.pl_bmassj * 317.8).toFixed(1) + ' M⊕' : '?'}</span>
                </div>
                
                <div class="flex justify-between items-center pt-2">
                    <span class="text-slate-400">Orbital Period</span>
                    <span class="text-white font-bold">${p.pl_orbper || '?'} days</span>
                </div>

                <div class="flex justify-between items-center pt-2">
                    <span class="text-slate-400">Equilibrium Temp</span>
                    <span class="text-white font-bold">${p.pl_eqt || '?'} K</span>
                </div>
                 <!-- Visual Bar for Temp (Habitable 200-320K) -->
                 <div class="w-full bg-white/10 rounded-full h-1.5 mt-1 relative">
                    <!-- Marker for habitable zone -->
                    <div class="absolute left-[30%] right-[50%] top-0 bottom-0 bg-green-500/30"></div>
                    <div class="bg-orange-500 h-1.5 rounded-full" style="width: ${Math.min(100, ((parseFloat(p.pl_eqt) || 0) / 1000) * 100)}%"></div>
                </div>

                <div class="flex justify-between items-center pt-2">
                    <span class="text-slate-400">Discovery Year</span>
                    <span class="text-white font-bold text-xs bg-white/10 px-2 py-1 rounded">${p.disc_year}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeComparisonModal() {
    const modal = document.getElementById('comparison-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}


