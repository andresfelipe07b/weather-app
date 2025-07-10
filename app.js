document.getElementById('form-city').addEventListener('submit', async function(e) {
    e.preventDefault();
    const city = document.getElementById('city').value;
    const weatherDiv = document.getElementById('weather');
    const errorDiv = document.getElementById('error');
    weatherDiv.style.display = 'none';
    errorDiv.textContent = '';
    const url = "https://weather-app-backend-production-1f33.up.railway.app";

    try {
        // Current weather
        const res = await fetch(`${url}/api/weather?ciudad=${encodeURIComponent(city)}`);
        if (!res.ok) throw new Error('Could not fetch weather');
        const data = await res.json();

        document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('description').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById('wind').textContent = `Wind: ${data.wind.speed} m/s`;
        document.getElementById('icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="weather icon">`;
        // Precipitation probability (not in weather, but in forecast)
        document.getElementById('precipitation').textContent = '';

        // Extended forecast
        const forecast = await getForecast(city);
        // Precipitation probability next hour
        if (forecast.list[0].pop !== undefined) {
            document.getElementById('precipitation').textContent = `Precipitation chance: ${Math.round(forecast.list[0].pop * 100)}%`;
        }
        showHourlyChart(forecast.list);
        showDailyForecast(forecast.list);

        weatherDiv.style.display = 'block';
    } catch (err) {
        errorDiv.textContent = 'Could not fetch weather for that city.';
    }
});

// Dynamically load Chart.js
function loadChartJs(callback) {
    if (window.Chart) return callback();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = callback;
    document.head.appendChild(script);
}

async function getForecast(city) {
    const res = await fetch(`${url}/api/forecast?ciudad=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Could not fetch forecast');
    return await res.json();
}

function showHourlyChart(list) {
    const hours = list.slice(0, 8).map(item => {
        const date = new Date(item.dt * 1000);
        return date.getHours() + ':00';
    });
    const temps = list.slice(0, 8).map(item => item.main.temp);
    loadChartJs(() => {
        const ctx = document.getElementById('hourlyTempChart').getContext('2d');
        if (window.hourlyTempChartInstance) window.hourlyTempChartInstance.destroy();
        window.hourlyTempChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
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

function showDailyForecast(list) {
    // Group by day
    const days = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!days[day]) days[day] = [];
        days[day].push(item);
    });
    // Take next 6 days (excluding today)
    const daysKeys = Object.keys(days).slice(1, 7);
    const daysContainer = document.getElementById('days-container');
    daysContainer.innerHTML = '';
    daysKeys.forEach(day => {
        const items = days[day];
        const temps = items.map(i => i.main.temp);
        const min = Math.round(Math.min(...temps));
        const max = Math.round(Math.max(...temps));
        const icon = items[0].weather[0].icon;
        daysContainer.innerHTML += `
            <div class="day">
                <span>${day}</span>
                <img class="icon-day" src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
                <div class="minmax">${max}° / ${min}°</div>
            </div>
        `;
    });
}