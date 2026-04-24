declare global {
  interface Window {
    Didit?: {
      init: (config: {
        appId: string;
        sessionId: string;
        userEmail: string;
        userName: string;
        onSuccess?: () => void;
        onError?: (error: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export {};
