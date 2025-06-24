// landing.js - ganti seluruh isi file dengan ini:

// ========== CAROUSEL FUNCTIONALITY ==========
function scrollDivisions(direction) {
  const carousel = document.querySelector('.divisions-carousel');
  const cardWidth = document.querySelector('.division-card').offsetWidth + 24;
  const scrollAmount = cardWidth * direction;
  
  carousel.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  });
}

// ========== COUNTDOWN TIMER ==========
const endTime = new Date();
endTime.setHours(9);
endTime.setMinutes(40);
endTime.setSeconds(0);

function updateCountdown() {
  const now = new Date();
  const diff = endTime - now;

  if (diff > 0) {
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById('countdown-timer').textContent =
      `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;
  } 
}

setInterval(updateCountdown, 1000);

// ========== CALENDAR FUNCTIONALITY ==========
const hariIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const today = new Date();
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay());

// Load schedules from API
function loadSchedules() {
  fetch('/api/get_schedules')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update current activity
        updateCurrentActivity(data.data);
        
        // Update calendar
        updateCalendar(data.data);
      }
    });
}

// In landing.js, replace the updateCurrentActivity function with this:
function updateCurrentActivity(schedules) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Find current schedule
  const currentSchedule = schedules.find(schedule => {
    const [startHour, startMinute] = schedule.jam.split(':').map(Number);
    const duration = parseInt(schedule.durasi);
    const endHour = startHour + Math.floor((startMinute + duration) / 60);
    const endMinute = (startMinute + duration) % 60;
    
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  });

  const infoBox = document.querySelector('.info-box');
  if (currentSchedule) {
    const endTime = calculateEndTime(currentSchedule.jam, currentSchedule.durasi);
    infoBox.innerHTML = `
      <div>
        <p><strong>Saat ini sedang berlangsung</strong><br>
        ${currentSchedule.matkul} | ${currentSchedule.kelas} <br>
        ${currentSchedule.jam}-${endTime}</p>
      </div>
      <div class="countdown">
        <div style="font-size: 1.2rem; font-weight: bold;" id="countdown-timer">00:00:00</div>
        <div>Time Remaining</div>
      </div>
    `;
    
    // Start countdown
    startCountdown(currentSchedule.jam, currentSchedule.durasi, document.getElementById('countdown-timer'));
  } else {
    infoBox.innerHTML = `
      <div>
        <p><strong>Tidak ada kelas yang sedang berlangsung</strong></p>
      </div>
    `;
  }
}

// Add this function to landing.js (same as in dashboard.js)
function startCountdown(startTime, duration, element) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const durationMinutes = parseInt(duration);
  
  // Calculate end time
  const totalMinutes = startHour * 60 + startMinute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  
  function update() {
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const diff = endTime - now;
    
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      element.textContent = 
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`;
    } else {
      element.textContent = "00:00:00";
      clearInterval(interval);
      // Refresh current schedule when countdown ends
      loadSchedules(); // This will refresh the data
    }
  }
  
  // Update immediately and then every second
  update();
  const interval = setInterval(update, 1000);
  
  // Return interval ID so it can be cleared if needed
  return interval;
}

// Update calendar with schedules
function updateCalendar(schedules) {
  document.getElementById("calendar-month").innerText = today.toLocaleString("id-ID", { month: "long" });

  // Group schedules by day
  const schedulesByDay = {
    1: [], // Senin
    2: [], // Selasa
    3: [], // Rabu
    4: [], // Kamis
    5: []  // Jumat
  };

  schedules.forEach(schedule => {
    const dayMap = {
      'Senin': 1,
      'Selasa': 2,
      'Rabu': 3,
      'Kamis': 4,
      'Jumat': 5
    };
    
    const dayIndex = dayMap[schedule.hari];
    if (dayIndex) {
      schedulesByDay[dayIndex].push({
        title: schedule.matkul,
        time: `${schedule.jam}-${calculateEndTime(schedule.jam, schedule.durasi)}`,
        kelas: schedule.kelas
      });
    }
  });

  // Initialize calendar days
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    document.getElementById(`day-date-${i}`).innerText = date.getDate();
    document.getElementById(`day-name-${i}`).innerText = hariIndo[date.getDay()];

    const dayElement = document.querySelector(`.calendar-day[data-day="${i}"]`);
    
    // Highlight today
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add("active");
      renderJadwal(date.getDay(), schedulesByDay);
    }

    dayElement.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day").forEach(el => el.classList.remove("active"));
      dayElement.classList.add("active");
      renderJadwal(date.getDay(), schedulesByDay);
    });
  }
}

// Render schedule for specific day
function renderJadwal(dayIndex, schedulesByDay) {
  const container = document.getElementById("schedule-list");
  container.innerHTML = "";
  
  // Mapping index hari ke nama hari
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDay = dayNames[dayIndex];
  
  // Get schedules for this day
  const daySchedules = schedulesByDay[dayIndex] || [];
  
  if (daySchedules.length === 0) {
    container.innerHTML = "<div class='schedule-item'><p>Tidak ada jadwal hari ini</p></div>";
  } else {
    daySchedules.forEach(item => {
      const div = document.createElement("div");
      div.className = "schedule-item";
      div.innerHTML = `<strong>${item.title}</strong>
                      <p>${item.kelas}</p>
                      <p>${item.time}</p>`;
      container.appendChild(div);
    });
  }
}

// Calculate end time
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + parseInt(duration);
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// Load schedules when page loads
document.addEventListener("DOMContentLoaded", function() {
  loadSchedules();
});