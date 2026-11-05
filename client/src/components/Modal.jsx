import { useEffect } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => { const close = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', close); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', close); document.body.style.overflow = ''; }; }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button></header>{children}</section></div>;
}
