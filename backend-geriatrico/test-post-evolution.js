async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'admin', password: 'medico123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('token:', token ? 'ok' : 'missing');

    const residentesRes = await fetch('http://localhost:5000/api/residentes', {
      headers: { authorization: token }
    });
    const residentes = await residentesRes.json();
    const residente = residentes[0];
    if (!residente) {
      console.error('No residente found');
      return;
    }
    console.log('Resident id:', residente._id);

    const evolutionRes = await fetch(`http://localhost:5000/api/residentes/${residente._id}/evoluciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: token },
      body: JSON.stringify({ categoria: 'incidente', nota: 'Test incident note' })
    });
    const evolutionData = await evolutionRes.json();
    console.log('Post evolution status:', evolutionRes.status, evolutionData.message || JSON.stringify(evolutionData));

    const updatedRes = await fetch('http://localhost:5000/api/residentes', {
      headers: { authorization: token }
    });
    const updated = await updatedRes.json();
    const updatedResidente = updated.find(r => r._id === residente._id);
    console.log('Updated latest evolutions:', JSON.stringify(updatedResidente?.evoluciones?.slice(-5), null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
