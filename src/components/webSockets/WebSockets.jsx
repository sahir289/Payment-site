import { useEffect } from 'react';
import { io } from 'socket.io-client';
export const socket = io(`${import.meta.env.VITE_API_WS_URL}`);


const WebSockets = ({checkPaymentStatusHandler}) => {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to the server');
    });
    
    socket.on('new-entry', (data) => {
      console.log('New entry received:', data);
      // Handle the new entry data
      // fetchUsersData()
      checkPaymentStatusHandler()
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from the server');
    });

    // Cleanup on component unmount
    return () => {
      socket.off('new-entry');
      socket.off('broadcast-message');
      socket.off('disconnect');
    };
  }, []);

  return null;
};

export default WebSockets;