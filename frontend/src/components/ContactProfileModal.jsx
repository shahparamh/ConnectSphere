import React from 'react'
import { MdClose, MdCall, MdVideocam, MdMessage, MdLocationOn, MdShield, MdBlock } from 'react-icons/md'
import Avatar from './Avatar'
import './ContactProfileModal.css'

export default function ContactProfileModal({ contact, onClose }) {
  if (!contact) return null

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-container" onClick={e => e.stopPropagation()}>
        <header className="cpm-header">
          <button className="cpm-close" onClick={onClose} aria-label="Close">
            <MdClose size={24} />
          </button>
        </header>

        <div className="cpm-content">
          <div className="cpm-profile-top">
            <Avatar 
              initials={contact.initials} 
              size={120} 
              isOnline={contact.isOnline} 
              color={contact.color || 'var(--primary)'}
            />
            <h2 className="cpm-name">{contact.name}</h2>
            {contact.phone && <p className="cpm-phone">{contact.phone}</p>}
            <p className="cpm-status">
              {contact.isOnline ? 'Online' : 'Last seen recently'}
            </p>
          </div>

          <div className="cpm-actions">
            <button className="cpm-action-btn" onClick={() => window.location.href = `tel:${contact.phone || '+1234567890'}`}>
              <div className="cpm-action-icon"><MdCall size={20} /></div>
              <span>Call</span>
            </button>
            <button className="cpm-action-btn">
              <div className="cpm-action-icon"><MdVideocam size={20} /></div>
              <span>Video</span>
            </button>
            <button className="cpm-action-btn" onClick={onClose}>
              <div className="cpm-action-icon"><MdMessage size={20} /></div>
              <span>Message</span>
            </button>
          </div>

          <div className="cpm-info-section">
            <div className="cpm-info-item">
              <MdLocationOn className="cpm-info-icon" />
              <div className="cpm-info-text">
                <p className="cpm-info-label">Live Location</p>
                <p className="cpm-info-val">Currently sharing with you</p>
              </div>
            </div>
            <div className="cpm-info-item">
              <MdShield className="cpm-info-icon" />
              <div className="cpm-info-text">
                <p className="cpm-info-label">Trust Level</p>
                <p className="cpm-info-val">Trusted Contact</p>
              </div>
            </div>
          </div>

          <div className="cpm-danger-zone">
            <button className="cpm-danger-btn">
              <MdBlock size={18} /> Block {contact.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
