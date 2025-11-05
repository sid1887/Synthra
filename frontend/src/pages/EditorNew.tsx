import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SchematicEditor } from '../components/SchematicEditor';
import { nanoid } from 'nanoid';

interface EditorProps {}

const Editor: React.FC<EditorProps> = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // Generate or use existing room ID
  const actualRoomId = roomId || nanoid(10);
  
  // Generate user info (in production, get from auth)
  const [userId] = React.useState(() => localStorage.getItem('synthra_user_id') || nanoid());
  const [username] = React.useState(() => localStorage.getItem('synthra_username') || `User-${userId.slice(0, 4)}`);
  
  // Store user info in localStorage
  React.useEffect(() => {
    localStorage.setItem('synthra_user_id', userId);
    localStorage.setItem('synthra_username', username);
  }, [userId, username]);
  
  // Redirect to room URL if no roomId was provided
  React.useEffect(() => {
    if (!roomId) {
      navigate(`/room/${actualRoomId}`, { replace: true });
    }
  }, [roomId, actualRoomId, navigate]);
  
  return (
    <SchematicEditor
      roomId={actualRoomId}
      userId={userId}
      username={username}
    />
  );
};

export default Editor;
