import React from 'react';

export const Select = ({ value, onValueChange, children, className='' }) => {
  // Extract all SelectItem elements found anywhere in children
  const items = [];
  const walk = (nodes) => {
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (child.type && child.type.displayName === 'SelectItem') {
        items.push(child);
      } else if (child.props && child.props.children) {
        walk(child.props.children);
      }
    });
  };
  walk(children);
  return (
    <select className={`select ${className}`} value={value} onChange={(e)=>onValueChange && onValueChange(e.target.value)}>
      <option value="" disabled hidden>{/* placeholder handled outside */}</option>
      {items.map((item, idx) => <option key={idx} value={item.props.value}>{item.props.children}</option>)}
    </select>
  );
};
export const SelectTrigger = ({ children }) => null;
export const SelectValue = ({ children }) => null;
export const SelectContent = ({ children }) => <>{children}</>;
export const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;
SelectItem.displayName = 'SelectItem';

export default Select;
