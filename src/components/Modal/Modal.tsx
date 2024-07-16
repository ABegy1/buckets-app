import React from 'react';
import './modal.css';

interface ModalProps {
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ name, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{name}</h2>
        <div className="modal-body">
          <div>
            <p>Player Name: {name}</p>
            <p>Shot#: <span>46</span></p>
          </div>
          <div className="points">
            <button>0</button>
            <button>1</button>
            <button>2</button>
          </div>
          <div className="actions">
            <button>Moneyball</button>
            <button>Double</button>
          </div>
          <button onClick={onClose}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
