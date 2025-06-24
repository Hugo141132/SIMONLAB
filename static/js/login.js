async function login() {
  const username = document.getElementById('nama').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      }),
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = data.redirect; // Redirect ke dashboard
    } else {
      errorMessage.textContent = data.error; // Pesan error dari backend
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    errorMessage.textContent = "Terjadi kesalahan pada server.";
    errorMessage.style.display = 'block';
  }
}
