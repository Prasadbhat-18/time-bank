import { useState, useEffect, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface GeolocationState {
  location: Location | undefined;
  error: string | null;
  loading: boolean;
  permissionStatus: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: undefined,
    error: null,
    loading: true,
    permissionStatus: null
  });

  const requestLocationPermission = useCallback(async () => {
    try {
      // Check if browser supports geolocation
      if (!navigator.geolocation) {
        setState(prev => ({
          ...prev,
          error: 'Geolocation is not supported by this browser',
          loading: false
        }));
        return;
      }

      // Declare as function (hoisted) so permission.onchange can call it
      function requestHighAccuracyLocation() {
        // Options for high-accuracy
        const geoOptions = {
          enableHighAccuracy: true,
          timeout: 30000, // 30 seconds
          maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            setState(prev => ({
              ...prev,
              location: newLocation,
              loading: false,
              error: null
            }));

            // Set up continuous watch
            navigator.geolocation.watchPosition(
              (position) => {
                const updatedLocation: Location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  timestamp: position.timestamp
                };
                setState(prev => ({ ...prev, location: updatedLocation }));
              },
              (watchErr) => {
                console.warn('Location watch error:', watchErr.message);
              },
              {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 10000
              }
            );

            // Store watch cleanup on state? Not necessary here; watch cleared on unmount by consumer if needed
          },
          (error) => {
            let errorMessage = 'Unable to retrieve location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied by user. Please enable location permissions in your browser settings to use emergency features.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your GPS/location services.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = `Location error: ${error.message}`;
                break;
            }

            setState(prev => ({
              ...prev,
              error: errorMessage,
              loading: false
            }));
          },
          geoOptions
        );
      }

      // Always check permission status first
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permissionStatus: permission.state }));

        // Listen for permission changes
        permission.onchange = () => {
          console.log('Geolocation permission changed:', permission.state);
          setState(prev => ({ ...prev, permissionStatus: permission.state }));
          if (permission.state === 'granted') {
            // Retry location request if permission was just granted
            requestHighAccuracyLocation();
          }
        };

        // If already denied, show clear message
        if (permission.state === 'denied') {
          setState(prev => ({
            ...prev,
            error: 'Location access is blocked. Please enable location permissions in your browser settings.',
            loading: false
          }));
          return;
        }
      }

      // Start location request
      requestHighAccuracyLocation();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to access location services',
        loading: false
      }));
    }
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const refreshLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    requestLocationPermission();
  }, [requestLocationPermission]);

  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setState(prev => ({ ...prev, location: newLocation, error: null }));
          resolve(newLocation);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS/location services.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again or check your connection.';
              break;
          }
          setState(prev => ({ ...prev, error: errorMessage }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30s
          maximumAge: 0
        }
      );
    });
  }, []);

  return {
    location: state.location,
    error: state.error,
    loading: state.loading,
    permissionStatus: state.permissionStatus,
    refreshLocation,
    getCurrentLocation
  };
}