document.addEventListener('DOMContentLoaded', () => {
    fetchBlackHoles();
});

async function fetchBlackHoles() {
    const tbody = document.getElementById('blackhole-table-body');
    const resultCount = document.getElementById('results-count');

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-primary font-bold animate-pulse">Accessing Deep Space Network...</td></tr>';

    try {
        const response = await fetch('/api/blackholes');
        const data = await response.json();

        tbody.innerHTML = '';

        if (resultCount) {
            resultCount.innerText = `Showing ${data.length} results`;
        }

        data.forEach(bh => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-primary/5 transition-colors border-b border-[#315a68]/10 group cursor-default';
            row.innerHTML = `
                <td class="px-6 py-4 text-primary font-semibold"><a class="hover:underline" href="#">${bh.name}</a></td>
                <td class="px-6 py-4 text-slate-300">${bh.type}</td>
                <td class="px-6 py-4 text-slate-300">${bh.mass}</td>
                <td class="px-6 py-4 text-slate-300">${bh.distance}</td>
                <td class="px-6 py-4 text-slate-300">${bh.constellation}</td>
                <td class="px-6 py-4 text-slate-300">2024-05-12</td>
                <td class="px-6 py-4 text-right">
                    <span class="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">Verified</span>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error("Error fetching black holes:", err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-500">Error retrieving black hole telemetry.</td></tr>';
    }
}
