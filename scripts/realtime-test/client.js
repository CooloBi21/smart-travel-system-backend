const { io } = require('socket.io-client');

const token = process.argv[2];

if (!token) {
  console.error('Missing JWT token.');
  process.exit(1);
}

const socket = io('http://localhost:5000', {
  auth: {
    token,
  },
});

socket.on('connect', () => {
  console.log('WebSocket connected.');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error(
    'WebSocket connection error:',
    error.message,
  );
});

socket.on('disconnect', (reason) => {
  console.log(
    'WebSocket disconnected:',
    reason,
  );
});

socket.on('booking.created', (data) => {
  console.log('Received booking.created:');
  console.log(JSON.stringify(data, null, 2));
});