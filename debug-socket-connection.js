// Simple Node.js script to test Socket.IO connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('[DEBUG] Connected to server with ID:', socket.id);
  console.log('[DEBUG] Socket connected:', socket.connected);

  // Try to create a room
  console.log('[DEBUG] Emitting create_room...');
  socket.emit('create_room', { nickname: 'TestPlayer' });
});

socket.on('disconnect', () => {
  console.log('[DEBUG] Disconnected from server');
});

socket.on('state_update', (state) => {
  console.log('[DEBUG] Received state_update:', JSON.stringify(state, null, 2));
});

socket.on('room_created', (data) => {
  console.log('[DEBUG] Received room_created:', data);
});

socket.on('error', (error) => {
  console.log('[DEBUG] Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.log('[DEBUG] Connection error:', error.message);
});

// Keep alive for 10 seconds
setTimeout(() => {
  console.log('[DEBUG] Closing connection...');
  socket.close();
  process.exit(0);
}, 10000);
