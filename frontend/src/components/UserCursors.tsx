/**
 * User Cursors Component - Shows other users' cursor positions
 */

import React from 'react';
import { Circle } from 'react-konva';

interface Cursor {
  user_id: string;
  username: string;
  position: { x: number; y: number };
}

interface UserCursorsProps {
  cursors: Cursor[];
  currentUserId: string;
}

// Color palette for user cursors
const CURSOR_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export const UserCursors: React.FC<UserCursorsProps> = ({ cursors, currentUserId }) => {
  return (
    <>
      {cursors
        .filter(cursor => cursor.user_id !== currentUserId) // Don't show own cursor
        .map((cursor, index) => {
          const color = CURSOR_COLORS[index % CURSOR_COLORS.length];
          
          return (
            <React.Fragment key={cursor.user_id}>
              {/* Cursor dot */}
              <Circle
                x={cursor.position.x}
                y={cursor.position.y}
                radius={4}
                fill={color}
                shadowBlur={4}
                shadowColor={color}
                shadowOpacity={0.5}
              />
              
              {/* Username label */}
              <Circle
                x={cursor.position.x + 10}
                y={cursor.position.y - 10}
                radius={0}
                // Note: Konva doesn't support text following cursor easily
                // In production, use HTML overlay for cursor labels
              />
            </React.Fragment>
          );
        })}
    </>
  );
};
