require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function main() {
  const passwordPlano = '123456';
  const passwordHash = await bcrypt.hash(passwordPlano, 10);
  const passwordCorrecta = await bcrypt.compare(passwordPlano, passwordHash);

  const token = jwt.sign(
    { id: 1, correo: 'admin@test.com', rol: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log('DOTENV OK:', Boolean(process.env.JWT_SECRET));
  console.log('BCRYPT OK:', passwordCorrecta);
  console.log('JWT TOKEN:', token);
  console.log('JWT DECODED:', decoded);
}

main().catch((error) => {
  console.error('AUTH TEST ERROR:', error.message);
  process.exit(1);
});
