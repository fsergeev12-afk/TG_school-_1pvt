import { create } from 'zustand';

interface UIState {
  // Модальные окна
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  
  // Уведомления
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
  
  // Методы
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  modalContent: null,
  toast: null,
  
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),
  
  showToast: (message, type) => {
    set({ toast: { message, type } });
    // Автоматически скрываем через 3 секунды
    setTimeout(() => set({ toast: null }), 3000);
  },
  hideToast: () => set({ toast: null }),
}));





