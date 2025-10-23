import { mockBookings, mockUsers, mockServices, saveToStorage } from './dataService';

export function injectTestBooking(userId: string) {
  const provider = mockUsers[0];
  const requester = mockUsers.find(u => u.id === userId) || mockUsers[1];
  const service = mockServices[0];
  const booking = {
    id: 'test-booking-' + Date.now(),
    service_id: service.id,
    provider_id: provider.id,
    requester_id: requester.id,
    scheduled_start: new Date().toISOString(),
    scheduled_end: new Date(Date.now() + 3600000).toISOString(),
    duration_hours: 1,
    status: 'pending',
    confirmation_status: 'pending',
    credits_held: 10,
    credits_transferred: false,
    provider_notes: '',
    confirmed_at: null,
    created_at: new Date().toISOString(),
    provider,
    requester,
    service,
  };
  mockBookings.push(booking);
  saveToStorage('bookings', mockBookings);
  return booking;
}
