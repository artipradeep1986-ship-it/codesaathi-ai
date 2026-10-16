import { toast as hotToast, Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '14px',
          padding: '12px 18px',
          fontSize: '15px',
          fontWeight: 500,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
        },
        success: {
          style: {
            background: '#16A34A',
            color: '#FFFFFF',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#16A34A',
          },
        },
        error: {
          style: {
            background: '#DC2626',
            color: '#FFFFFF',
          },
          iconTheme: {
            primary: '#FFFFFF',
            secondary: '#DC2626',
          },
        },
      }}
    />
  );
};

export const toast = hotToast;
