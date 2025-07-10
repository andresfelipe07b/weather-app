document.getElementById('form-ciudad').addEventListener('submit', async function(e) {
    e.preventDefault();
    const ciudad = document.getElementById('ciudad').value;
    const climaDiv = document.getElementById('clima');
    const errorDiv = document.getElementById('error');
    climaDiv.style.display = 'none';
    errorDiv.textContent = '';
    const url ="https://weather-app-backend-production-1f33.up.railway.app";

    try {
        // Clima actual
        const res = await fetch(`${url}/api/weather?ciudad=${encodeURIComponent(ciudad)}`);
        if (!res.ok) throw new Error('No se pudo obtener el clima');
        const data = await res.json();

        document.getElementById('nombre-ciudad').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('descripcion').textContent = data.weather[0].description;
        document.getElementById('humedad').textContent = `Humedad: ${data.main.humidity}%`;
        document.getElementById('viento').textContent = `Viento: ${data.wind.speed} m/s`;
        document.getElementById('icono').innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="icono clima">`;
        // Probabilidad de precipitación (no está en weather, pero sí en forecast)
        document.getElementById('precipitacion').textContent = '';

        // Pronóstico extendido
        const forecast = await obtenerPronostico(ciudad);
        // Probabilidad de precipitación próxima hora
        if (forecast.list[0].pop !== undefined) {
            document.getElementById('precipitacion').textContent = `Prob. precipitación: ${Math.round(forecast.list[0].pop * 100)}%`;
        }
        mostrarGraficaHoras(forecast.list);
        mostrarPronosticoDias(forecast.list);

        climaDiv.style.display = 'block';
    } catch (err) {
        errorDiv.textContent = 'No se pudo obtener el clima para esa ciudad.';
    }
});

// Cargar Chart.js dinámicamente
function cargarChartJs(callback) {
    if (window.Chart) return callback();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = callback;
    document.head.appendChild(script);
}

async function obtenerPronostico(ciudad) {
    const res = await fetch(`${url}/api/forecast?ciudad=${encodeURIComponent(ciudad)}`);
    if (!res.ok) throw new Error('No se pudo obtener el pronóstico');
    return await res.json();
}

function mostrarGraficaHoras(lista) {
    const horas = lista.slice(0, 8).map(item => {
        const fecha = new Date(item.dt * 1000);
        return fecha.getHours() + ':00';
    });
    const temps = lista.slice(0, 8).map(item => item.main.temp);
    cargarChartJs(() => {
        const ctx = document.getElementById('graficaTempHoras').getContext('2d');
        if (window.graficaTemp) window.graficaTemp.destroy();
        window.graficaTemp = new Chart(ctx, {
            type: 'line',
            data: {
                labels: horas,
                datasets: [{
                    label: 'Temp (°C)',
                    data: temps,
                    borderColor: '#ffd600',
                    backgroundColor: 'rgba(255,214,0,0.1)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffd600',
                    fill: true,
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#fff' } },
                    y: { grid: { color: '#333' }, ticks: { color: '#fff' } }
                }
            }
        });
    });
}

function mostrarPronosticoDias(lista) {
    // Agrupar por día
    const dias = {};
    lista.forEach(item => {
        const fecha = new Date(item.dt * 1000);
        const dia = fecha.toLocaleDateString('es-CO', { weekday: 'short' });
        if (!dias[dia]) dias[dia] = [];
        dias[dia].push(item);
    });
    // Tomar los próximos 6 días (excluyendo hoy)
    const diasKeys = Object.keys(dias).slice(1, 7);
    const diasContainer = document.getElementById('dias-container');
    diasContainer.innerHTML = '';
    diasKeys.forEach(dia => {
        const items = dias[dia];
        const temps = items.map(i => i.main.temp);
        const min = Math.round(Math.min(...temps));
        const max = Math.round(Math.max(...temps));
        const icono = items[0].weather[0].icon;
        diasContainer.innerHTML += `
            <div class="dia">
                <span>${dia}</span>
                <img class="icono-dia" src="https://openweathermap.org/img/wn/${icono}.png" alt="icono">
                <div class="minmax">${max}° / ${min}°</div>
            </div>
        `;
    });
} 