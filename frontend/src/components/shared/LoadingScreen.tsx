interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Загрузка...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-telegram-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-button mx-auto mb-4"></div>
        <p className="text-telegram-text">{message}</p>
      </div>
    </div>
  );
}



