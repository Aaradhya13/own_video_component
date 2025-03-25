import React from 'react';
import { Mic, MicOff, Ban, UserX } from 'lucide-react';
import { Attendee } from '../types';

interface AttendeesListProps {
  attendees: Attendee[];
  isHost: boolean;
  onToggleMute: (attendeeId: string) => void;
  onBlockAttendee: (attendeeId: string) => void;
  onRemoveAttendee: (attendeeId: string) => void;
}

const AttendeesList = ({
  attendees,
  isHost,
  onToggleMute,
  onBlockAttendee,
  onRemoveAttendee
}: AttendeesListProps) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">Attendees ({attendees.length})</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {attendees.map((attendee) => (
          <div
            key={attendee.id}
            className={`p-4 border-b flex items-center justify-between ${
              attendee.isBlocked ? 'bg-red-50' : ''
            }`}
          >
            <div>
              <p className="font-medium">{attendee.email}</p>
              <p className="text-sm text-gray-500">
                {attendee.isHost ? 'Host' : 'Attendee'}
              </p>
            </div>
            
            {isHost && !attendee.isHost && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onToggleMute(attendee.id)}
                  className={`p-1 rounded-full ${
                    attendee.isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {attendee.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                
                <button
                  onClick={() => onBlockAttendee(attendee.id)}
                  className={`p-1 rounded-full ${
                    attendee.isBlocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Ban size={16} />
                </button>
                
                <button
                  onClick={() => onRemoveAttendee(attendee.id)}
                  className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                >
                  <UserX size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendeesList;