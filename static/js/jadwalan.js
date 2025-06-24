document.addEventListener("DOMContentLoaded", function() {
  // Mobile menu toggle
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', function() {
      sidebar.classList.toggle('-translate-x-full');
    });
  }

  // Load schedules on page load
  if (document.getElementById('scheduleList')) {
    loadSchedules();
  }

  // Filter functionality
  const filterSelects = document.querySelectorAll('.filter-select');
  const searchInput = document.querySelector('.search-input');
  
  filterSelects.forEach(select => {
    select.addEventListener('change', filterSchedules);
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', filterSchedules);
  }

  // Form submission handler
  const scheduleForm = document.getElementById('scheduleForm');
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const matkul = document.getElementById('matkul').value;
      const kelas = document.getElementById('kelas').value;
      const hari = document.getElementById('hari').value;
      const jam = document.getElementById('jam').value;
      const durasi = document.getElementById('durasi').value;
      
      // Send data to server
      fetch('/api/add_schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matkul: matkul,
          kelas: kelas,
          hari: hari,
          jam: jam,
          durasi: durasi
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Jadwal berhasil disimpan!');
          window.location.href = '/perjadwal.html';
        } else {
          alert('Gagal menyimpan jadwal: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menyimpan jadwal');
      });
    });
  }
});

// Load schedules from server
function loadSchedules() {
  fetch('/api/get_schedules')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const scheduleList = document.getElementById('scheduleList');
        if (scheduleList) {
          scheduleList.innerHTML = '';
          
          data.data.forEach(schedule => {
            const endTime = calculateEndTime(schedule.jam, schedule.durasi);
            
            const scheduleCard = document.createElement('div');
            scheduleCard.className = 'schedule-card';
            scheduleCard.dataset.id = schedule.id;
            
            scheduleCard.innerHTML = `
              <div class="schedule-info">
                <div class="schedule-icon bg-green-100 text-green-600">
                  <i class="bi bi-plus-circle"></i>
                </div>
                <div>
                  <h3 class="schedule-title">${schedule.matkul} | ${schedule.kelas}</h3>
                  <div class="schedule-meta">
                    <span class="schedule-day">${schedule.hari}</span>
                    <span class="schedule-time">${schedule.jam} - ${endTime}</span>
                  </div>
                </div>
              </div>
              <div class="schedule-actions">
                <button class="btn-edit" onclick="editSchedule('${schedule.id}')">
                  <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn-delete" onclick="confirmDelete('${schedule.id}')">
                  <i class="bi bi-trash"></i> Hapus
                </button>
              </div>
            `;
            
            scheduleList.appendChild(scheduleCard);
          });
        }
      }
    });
}

// Filter schedules based on selections
function filterSchedules() {
  const dayFilter = document.querySelector('.filter-select:nth-of-type(1)').value;
  const classFilter = document.querySelector('.filter-select:nth-of-type(2)').value;
  const searchTerm = document.querySelector('.search-input').value.toLowerCase();
  
  const scheduleCards = document.querySelectorAll('.schedule-card');
  
  scheduleCards.forEach(card => {
    const day = card.querySelector('.schedule-day').textContent;
    const className = card.querySelector('.schedule-title').textContent;
    const textContent = card.textContent.toLowerCase();
    
    const dayMatch = dayFilter === 'Semua Hari' || day === dayFilter;
    const classMatch = classFilter === 'Semua Kelas' || className.includes(classFilter);
    const searchMatch = textContent.includes(searchTerm);
    
    if (dayMatch && classMatch && searchMatch) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Edit schedule function
function editSchedule(id) {
  console.log(`Editing schedule with ID: ${id}`);
  alert(`Fitur edit jadwal ID ${id} akan dikembangkan`);
}

// Delete confirmation function
function confirmDelete(id) {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal ini?`)) {
        const card = document.querySelector(`.schedule-card[data-id="${id}"]`);
        
        if (!card) return;
        
        // Ambil data jadwal dari card
        const matkul = card.querySelector('.schedule-title').textContent.split(' | ')[0];
        const kelas = card.querySelector('.schedule-title').textContent.split(' | ')[1];
        const hari = card.querySelector('.schedule-day').textContent;
        const jam_mulai = card.querySelector('.schedule-time').textContent.split(' - ')[0];
        
        // Kirim permintaan hapus ke server
        fetch('/api/delete_schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                matkul: matkul,
                kelas: kelas,
                hari: hari,
                jam_mulai: jam_mulai
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hapus dari UI
                card.remove();
                alert('Jadwal berhasil dihapus!');
                
                // Refresh tampilan dashboard jika ada
                if (typeof loadSchedulesForDashboard === 'function') {
                    loadSchedulesForDashboard();
                }
            } else {
                alert('Gagal menghapus jadwal: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menghapus jadwal');
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