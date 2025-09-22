import React from 'react';
export const Button = ({ className='', variant='default', children, ...props }) => {
  const v =
    variant === 'destructive' ? 'destructive' :
    variant === 'secondary' ? 'secondary' :
    variant === 'outline' ? 'outline' :
    'default';
  const cls = ['btn', v==='default'?'':v, className, (v==='default'?'':'')].join(' ').trim();
  const finalCls = cls.replace('  ',' ');
  return <button className={finalCls} {...props}>{children}</button>;
};
export default Button;
