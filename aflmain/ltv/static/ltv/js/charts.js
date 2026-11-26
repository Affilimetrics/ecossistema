(function () {
  const payloadNode = document.getElementById('chart-payload');
  if (!payloadNode) return;

  let payload = {};
  try {
    payload = JSON.parse(payloadNode.textContent || '{}');
  } catch (error) {
    console.error('Não foi possível ler os dados dos gráficos.', error);
  }

  const css = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const green = css('--primary', '#018D3E');
  const red = css('--danger', '#E71506');
  const text = css('--text-secondary', '#65756A');
  const grid = 'rgba(16,37,26,.07)';

  function emptyState(id, isEmpty) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const wrapper = canvas.closest('.chart-wrap');
    if (wrapper) wrapper.classList.toggle('is-empty', isEmpty);
  }

  function makeChart(id, key, type, options = {}) {
    const canvas = document.getElementById(id);
    const data = payload[key];
    if (!canvas) return null;

    const hasValues = data && Array.isArray(data.labels) && data.labels.length &&
      Array.isArray(data.values) && data.values.length &&
      data.values.some(value => Number(value) !== 0);

    if (!hasValues || typeof window.Chart === 'undefined') {
      emptyState(id, true);
      return null;
    }

    emptyState(id, false);
    const horizontal = options.indexAxis === 'y';
    const dataset = {
      label: options.label || 'Comissões aprovadas e atribuídas',
      data: data.values,
      backgroundColor: type === 'doughnut'
        ? [green, red, '#2ECC71', '#D6A33C', '#2476A7', '#7A8F80']
        : type === 'bar'
          ? data.values.map((_, index) => index === 0 ? red : 'rgba(1,141,62,.76)')
          : 'rgba(1,141,62,.13)',
      borderColor: type === 'doughnut' ? '#FDF7E6' : (options.borderColor || green),
      borderWidth: type === 'doughnut' ? 3 : 2,
      borderRadius: type === 'bar' ? 7 : 0,
      fill: type === 'line',
      tension: .34,
      pointRadius: type === 'line' ? 3 : 0,
      pointHoverRadius: 5,
      pointBackgroundColor: red,
      pointBorderColor: '#FDF7E6',
      pointBorderWidth: 2,
    };

    const currencyTicks = {
      color: text,
      font: { family: 'Inter', size: 9 },
      callback: value => 'R$ ' + Number(value).toLocaleString('pt-BR'),
    };
    const categoryTicks = {
      color: text,
      font: { family: 'Inter', size: 9 },
      maxRotation: 0,
      autoSkip: true,
    };

    const config = {
      type,
      data: { labels: data.labels, datasets: [dataset] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: {
            display: type === 'doughnut',
            position: 'bottom',
            labels: { color: text, usePointStyle: true, boxWidth: 7, padding: 15, font: { family: 'Inter', size: 9 } },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const value = type === 'doughnut'
                  ? context.parsed
                  : horizontal ? context.parsed.x : context.parsed.y;
                return ` R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
        scales: type === 'doughnut' ? {} : horizontal ? {
          x: { beginAtZero: true, grid: { color: grid }, ticks: currencyTicks },
          y: { grid: { display: false }, ticks: categoryTicks },
        } : {
          x: { grid: { display: false }, ticks: categoryTicks },
          y: { beginAtZero: true, grid: { color: grid }, ticks: currencyTicks },
        },
      },
    };

    return new Chart(canvas, config);
  }

  window.LtvCharts = { makeChart, payload };
  makeChart('monthlyChart', 'monthly', 'line', { label: 'Comissões atribuídas' });
  makeChart('productChart', 'products', 'doughnut');
  makeChart('channelChart', 'channels', 'bar', { indexAxis: 'y', label: 'Comissões por canal' });
  makeChart('marketplaceChart', 'marketplaces', 'bar', { indexAxis: 'y', label: 'Comissões por marketplace', borderColor: red });
  makeChart('campaignChart', 'campaigns', 'bar', { indexAxis: 'y', label: 'Comissões por campanha' });
})();
