(function () {
  const payloadNode = document.getElementById('chart-payload');
  if (!payloadNode || !window.LtvCharts) return;
  let payload;
  try { payload = JSON.parse(payloadNode.textContent || '{}'); } catch { return; }
  const projection = payload.projection;
  const canvas = document.getElementById('projectionChart');
  const empty = document.querySelector('[data-chart-empty="projection"]');
  if (!canvas || !projection || !projection.available || typeof window.Chart === 'undefined') {
    if (canvas?.closest('.chart-wrap')) canvas.closest('.chart-wrap').classList.add('is-empty');
    return;
  }
  const color = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#E71506';
  const green = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#018D3E';
  const text = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#65756A';
  if (empty) empty.style.display = 'none';
  new Chart(canvas, {
    type: 'line',
    data: { labels: projection.labels, datasets: [
      { label: 'LTV observado', data: projection.observed, borderColor: green, backgroundColor: 'rgba(1,141,62,.12)', fill: true, spanGaps: false, tension: .3, pointRadius: 3 },
      { label: 'LTV projetado', data: projection.projected, borderColor: color, backgroundColor: 'rgba(231,21,6,.08)', borderDash: [6,5], fill: false, spanGaps: false, tension: .25, pointRadius: 3 },
      { label: 'Limite inferior (aprox.)', data: projection.confidence_low, borderColor: 'rgba(231,21,6,.35)', borderDash: [3,4], pointRadius: 0, fill: false },
      { label: 'Limite superior (aprox.)', data: projection.confidence_high, borderColor: 'rgba(231,21,6,.35)', borderDash: [3,4], pointRadius: 0, fill: '-1' }
    ] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: text, usePointStyle: true, boxWidth: 7, font: { family: 'Inter', size: 9 } } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: R$ ${Number(c.parsed.y || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } } }, scales: { x: { grid: { display: false }, ticks: { color: text, font: { family: 'Inter', size: 9 } } }, y: { beginAtZero: true, grid: { color: 'rgba(16,37,26,.07)' }, ticks: { color: text, callback: v => 'R$ ' + Number(v).toLocaleString('pt-BR') } } } }
  });
})();
