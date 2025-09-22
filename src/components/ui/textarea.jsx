import React from 'react';
export const Textarea = ({ className='', ...props }) => <textarea className={`textarea ${className}`} {...props} />;
export default Textarea;
