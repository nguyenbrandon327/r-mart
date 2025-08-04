import { XIcon, AlertTriangleIcon, Trash2Icon, CheckIcon } from 'lucide-react';

export default function ConfirmationModal({ 
  id,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // "danger", "warning", "info"
  onConfirm,
  onCancel,
  isLoading = false
}) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onCancel();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2Icon className="h-6 w-6 text-error" />;
      case "warning":
        return <AlertTriangleIcon className="h-6 w-6 text-warning" />;
      case "info":
        return <CheckIcon className="h-6 w-6 text-info" />;
      default:
        return <AlertTriangleIcon className="h-6 w-6 text-warning" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "btn-error";
      case "warning":
        return "btn-warning";
      case "info":
        return "btn-primary";
      default:
        return "btn-error";
    }
  };

  return (
    <dialog id={id} className="modal">
      <div className="modal-box max-w-md">
        {/* CLOSE BUTTON */}
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* MODAL CONTENT */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-2">{title}</h3>
            <p className="text-base-content/70">{message}</p>
          </div>
        </div>

        {/* MODAL ACTIONS */}
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${getConfirmButtonClass()}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm mr-2" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>

      {/* BACKDROP */}
      <div className="modal-backdrop" onClick={handleCancel}>
        <button onClick={handleCancel}>close</button>
      </div>
    </dialog>
  );
} 