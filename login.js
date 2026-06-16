async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const output = document.getElementById('output');

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Credenciales invalidas o error en el servidor');
    }

    sessionStorage.setItem('token', data.token);
    output.textContent = JSON.stringify(data, null, 2);
    alert('Inicio de sesion exitoso');
  } catch (err) {
    console.error('Error al iniciar sesion:', err);
    output.textContent = JSON.stringify({ error: err.message }, null, 2);
    alert('No fue posible iniciar sesion');
  }
}

async function loadUsers() {
  const token = sessionStorage.getItem('token');
  const list = document.getElementById('userList');
  const output = document.getElementById('output');

  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      throw new Error('Usuario no autorizado. Verifica tu token.');
    }

    if (response.status === 403) {
      throw new Error('Acceso prohibido. Tu rol no tiene permisos.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar usuarios');
    }

    list.innerHTML = data.map((u) => `<li>${u.username || u.correo || u.nombre}</li>`).join('');
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error('Error al cargar usuarios:', err);
    output.textContent = JSON.stringify({ error: err.message }, null, 2);
  }
}
