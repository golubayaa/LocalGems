// src/components/Moderator/ConfirmModal.tsx
interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-gray-800 text-base mb-6">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 h-10 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
          >
            Да
          </button>
          <button
            onClick={onCancel}
            className="flex-1 h-10 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
          >
            Нет
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;