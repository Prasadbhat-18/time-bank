import { useEffect } from 'react';
import { injectTestBooking } from '../../services/testBookingInject';
import { useAuth } from '../../contexts/AuthContext';

export const InjectTestBooking: React.FC = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.id) {
      injectTestBooking(user.id);
    }
  }, [user?.id]);
  return null;
};
