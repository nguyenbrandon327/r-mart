import { useState, useEffect } from 'react';
import { MessageCircleMore, XIcon } from 'lucide-react';

export default function TalkToSellerModal({ 
  onClose, 
  onSendMessage, 
  sellerName, 
  productName,
  isLoading 
}) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Clear message when modal closes
  useEffect(() => {
    const modal = document.getElementById('talk_to_seller_modal');
    if (modal) {
      const handleClose = () => setMessage('');
      modal.addEventListener('close', handleClose);
      return () => modal.removeEventListener('close', handleClose);
    }
  }, []);

  return (
    <dialog id="talk_to_seller_modal" className="modal">
      <div className="modal-box max-w-md">
        {/* CLOSE BUTTON */}
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleClose}
          disabled={isLoading}
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* MODAL HEADER */}
        <div className="flex items-center gap-2 mb-6">
          <MessageCircleMore className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-xl">Message Seller</h3>
        </div>

        {/* CONTENT */}
        <div className="mb-6">
          <p className="text-sm text-base-content/70 mb-1">
            Send a message to <span className="font-medium text-base-content">{sellerName}</span> about:
          </p>
          <p className="font-medium text-base-content">{productName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* MESSAGE INPUT */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text text-base font-medium">Your message:</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'm interested in this item. Is it still available?"
              className="textarea textarea-bordered w-full h-32 resize-none focus:textarea-primary transition-colors duration-200"
              disabled={isLoading}
              autoFocus
              maxLength={500}
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                {message.length}/500 characters
              </span>
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary min-w-[140px]"
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircleMore className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* BACKDROP */}
      <div className="modal-backdrop" onClick={handleClose}>
        <button onClick={handleClose}>close</button>
      </div>
    </dialog>
  );
} 