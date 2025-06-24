from flask import Flask, render_template, redirect, url_for, request, jsonify, Response
import sqlite3, time
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime, timedelta

app = Flask(__name__, static_url_path='/static')
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Fungsi untuk validasi login
def validate_login(username, password):
    conn = sqlite3.connect('testing.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Admin WHERE Username = ? AND Password = ?", (username, password))
    result = cursor.fetchone()
    conn.close()
    return result is not None

# Fungsi untuk menyimpan jadwal ke database
def save_schedule(matkul, kelas, hari, jam_mulai, durasi):
    conn = sqlite3.connect('testing.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO Jadwal_lab (Matkul, Kelas, Hari, Jam_mulai, Durasi) VALUES (?, ?, ?, ?, ?)",
                   (matkul, kelas, hari, jam_mulai, durasi))
    conn.commit()
    conn.close()

# Route untuk API login
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if validate_login(username, password):
        return jsonify({"success": True, "redirect": url_for('perjadwal')})
    else:
        return jsonify({"success": False, "error": "Username atau password salah!"})

# Route untuk API tambah jadwal
@app.route('/api/add_schedule', methods=['POST'])
def api_add_schedule():
    data = request.get_json()
    try:
        save_schedule(
            data['matkul'],
            data['kelas'],
            data['hari'],
            data['jam'],
            data['durasi']
        )
        return jsonify({"success": True, "message": "Jadwal berhasil ditambahkan"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Route untuk mendapatkan semua jadwal
@app.route('/api/get_schedules')
def api_get_schedules():
    conn = sqlite3.connect('testing.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Jadwal_lab")
    schedules = cursor.fetchall()
    conn.close()
    
    result = []
    for schedule in schedules:
        result.append({
            "matkul": schedule[0],
            "kelas": schedule[1],
            "hari": schedule[2],
            "jam": schedule[3],
            "durasi": schedule[4],
            "id": schedule[0] + schedule[1] + schedule[2] + schedule[3]  # Generate simple ID
        })
    
    return jsonify({"success": True, "data": result})

# app.py - tambahkan sebelum if __name__ == '__main__':

# Fungsi untuk menghapus jadwal dari database
def delete_schedule(matkul, kelas, hari, jam_mulai):
    conn = sqlite3.connect('testing.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Jadwal_lab WHERE Matkul = ? AND Kelas = ? AND Hari = ? AND Jam_mulai = ?",
                   (matkul, kelas, hari, jam_mulai))
    conn.commit()
    conn.close()

# Route untuk API hapus jadwal
@app.route('/api/delete_schedule', methods=['POST'])
def api_delete_schedule():
    data = request.get_json()
    try:
        delete_schedule(
            data['matkul'],
            data['kelas'],
            data['hari'],
            data['jam_mulai']
        )
        return jsonify({"success": True, "message": "Jadwal berhasil dihapus"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/get_current_schedules', methods=['GET'])
def get_current_schedules():
    try:
        # Mapping hari Indonesia
        days_map = {
            0: 'Minggu',
            1: 'Senin',
            2: 'Selasa', 
            3: 'Rabu',
            4: 'Kamis',
            5: 'Jumat',
            6: 'Sabtu'
        }
        
        today = datetime.now().weekday()
        today_name = days_map[today]
        current_time = datetime.now().strftime("%H:%M")

        conn = sqlite3.connect('testing.db')
        cursor = conn.cursor()
        
        # Ambil semua jadwal hari ini
        cursor.execute("SELECT * FROM Jadwal_lab WHERE Hari=?", (today_name,))
        schedules = cursor.fetchall()
        conn.close()

        current_class = None
        for schedule in schedules:
            matkul, kelas, hari, jam_mulai, durasi = schedule
            start = datetime.strptime(jam_mulai, "%H:%M").time()
            
            # Hitung waktu selesai
            start_dt = datetime.strptime(jam_mulai, "%H:%M")
            end_dt = start_dt + timedelta(minutes=int(durasi))
            end_time = end_dt.strftime("%H:%M")
            
            # Cek apakah waktu sekarang berada dalam rentang jadwal
            now = datetime.now().time()
            if datetime.strptime(jam_mulai, "%H:%M").time() <= now <= end_dt.time():
                current_class = {
                    "matkul": matkul,
                    "kelas": kelas,
                    "jam_mulai": jam_mulai,
                    "jam_selesai": end_time,
                    "durasi": durasi,
                    "hari": hari
                }
                break

        if current_class:
            return jsonify({
                "status": "success",
                "data": current_class,
                "current_time": current_time
            })
        else:
            return jsonify({
                "status": "success", 
                "data": None,
                "message": "Tidak ada kelas yang sedang berlangsung"
            })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        })
    
# Route untuk halaman
@app.route('/')
def home():
    return render_template('html/landing.html')

@app.route('/login')
def login():
    return render_template('html/login.html')

@app.route('/perjadwal')
def perjadwal():
    return render_template('html/perjadwal.html')

@app.route('/perjadwal.html')
def perjadwal_html():
    return redirect('/perjadwal')

@app.route('/add')
def add():
    return render_template('html/add.html')

@app.route('/add.html')
def add_html():
    return redirect('/add')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5200, debug=True)