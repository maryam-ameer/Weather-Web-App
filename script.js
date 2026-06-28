// 🔑 YOUR API KEY (Replace this)
const API_KEY = "5c3d02ba70e46efec1717c211e7763f1";

// --- Selectors ---
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const rainChance = document.getElementById('rainChance');
const updateTime = document.getElementById('updateTime');
const errorMsg = document.getElementById('errorMsg');

async function fetchWeather(city) {
    // Reset UI
    errorMsg.classList.add('hidden');
    if (!city) {
        errorMsg.textContent = 'Please enter a city name!';
        errorMsg.classList.remove('hidden');
        return;
    }

    try {
        // 1️⃣ FETCH CURRENT WEATHER (Real-time temp, feels like, etc.)
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const weatherRes = await fetch(weatherUrl);
        
        if (!weatherRes.ok) {
            const errData = await weatherRes.json();
            if (weatherRes.status === 401) throw new Error('Invalid API Key. Check your key.');
            if (weatherRes.status === 404) throw new Error(`City "${city}" not found.`);
            throw new Error(errData.message || 'Server error.');
        }
        const weatherData = await weatherRes.json();

        // 2️⃣ FETCH FORECAST (Just to get the Rain Chance for the nearest hour)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&cnt=5`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        // --- 3️⃣ Find the forecast entry CLOSEST to the current time ---
        const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
        let closestForecast = forecastData.list[0];
        let smallestDiff = Math.abs(closestForecast.dt - now);

        for (const item of forecastData.list) {
            const diff = Math.abs(item.dt - now);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestForecast = item;
            }
        }

        // Extract rain chance (pop) from the closest entry
        const rainPercent = closestForecast.pop ? Math.round(closestForecast.pop * 100) : 0;
        
        // Extract forecast time for display
        const forecastTime = new Date(closestForecast.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // --- 4️⃣ UPDATE THE UI ---
        cityName.textContent = weatherData.name;
        temperature.textContent = Math.round(weatherData.main.temp);
        description.textContent = weatherData.weather[0].description;
        humidity.textContent = `${weatherData.main.humidity}%`;
        feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
        windSpeed.textContent = `${(weatherData.wind.speed * 3.6).toFixed(1)} km/h`;
        pressure.textContent = `${weatherData.main.pressure} hPa`;
        rainChance.textContent = `${rainPercent}%`;
        updateTime.textContent = `⏱️ ${forecastTime}`;

        // Optional: Change rain color if high
        if (rainPercent > 50) {
            rainChance.style.color = '#60a5fa';
        } else {
            rainChance.style.color = '#f1f5f9';
        }

    } catch (error) {
        errorMsg.textContent = `❌ ${error.message}`;
        errorMsg.classList.remove('hidden');
        // Reset fields to dashes
        cityName.textContent = '--';
        temperature.textContent = '--';
        description.textContent = '--';
        humidity.textContent = '--%';
        feelsLike.textContent = '--°C';
        windSpeed.textContent = '-- km/h';
        pressure.textContent = '-- hPa';
        rainChance.textContent = '--%';
        updateTime.textContent = '--';
    }
}

// --- Event Listeners ---
searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeather(cityInput.value);
});

// --- Auto-detect Location ---
window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
            try {
                const res = await fetch(url);
                const data = await res.json();
                cityInput.value = data.name;
                fetchWeather(data.name);
            } catch { /* silent fail */ }
        });
    }
});