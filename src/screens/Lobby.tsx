import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, X } from 'lucide-react';

const LobbyScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [allowedAttendees, setAllowedAttendees] = useState<string[]>([]);
  const [attendeeEmail, setAttendeeEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingRoom) {
      
      navigate(`/room/${room}`, { 
        state: { 
          email,
          isHost: true,
          allowedAttendees: [...allowedAttendees, email] 
        }
      });
    } else {
      // Join as attendee
      navigate(`/room/${room}`, { 
        state: { 
          email,
          isHost: false
        }
      });
    }
  };

  const handleAddAttendee = () => {
    if (attendeeEmail && !allowedAttendees.includes(attendeeEmail)) {
      setAllowedAttendees([...allowedAttendees, attendeeEmail]);
      setAttendeeEmail('');
    }
  };

  const removeAttendee = (emailToRemove: string) => {
    setAllowedAttendees(allowedAttendees.filter(email => email !== emailToRemove));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-center mb-8">
          <Video className="w-12 h-12 text-blue-500" />
          <h1 className="text-2xl font-bold ml-2">Video Conference</h1>
        </div>
        
        <div className="mb-6">
          <button
            onClick={() => setIsCreatingRoom(!isCreatingRoom)}
            className={`w-full py-2 rounded-md ${
              isCreatingRoom 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isCreatingRoom ? 'Creating New Room' : 'Create Room'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Room Code</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {isCreatingRoom && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Allowed Attendees</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="Enter attendee email"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {allowedAttendees.map((attendee) => (
                  <div key={attendee} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span className="text-sm text-gray-600">{attendee}</span>
                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isCreatingRoom ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;