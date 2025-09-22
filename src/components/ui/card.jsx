import React from 'react';
export const Card = ({ className='', children }) => <div className={`card ${className}`}>{children}</div>;
export const CardContent = ({ className='', children }) => <div className={`card-content ${className}`}>{children}</div>;
export default Card;
