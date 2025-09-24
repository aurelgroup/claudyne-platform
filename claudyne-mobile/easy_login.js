const { spawn } = require('child_process');

const easLogin = spawn('eas', ['login'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Envoyer l'email
setTimeout(() => {
  easLogin.stdin.write('marchekamna@gmail.com\n');
}, 1000);

// Envoyer le mot de passe
setTimeout(() => {
  easLogin.stdin.write('Lamino12@\n');
}, 3000);

easLogin.on('close', (code) => {
  console.log(`Login terminé avec code: ${code}`);
});