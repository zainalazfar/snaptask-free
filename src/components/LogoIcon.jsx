import React from 'react';
import logoImg from '../assets/logo.png';

export default function LogoIcon({ size = 56, className = '' }) {
  return (
    <img
      src={logoImg}
      alt="SnapTask Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block', background: 'transparent' }}
    />
  );
}
