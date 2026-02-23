import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ChevronDown, Sun, Moon } from 'lucide-react';

export const InputField = ({ label, name, value, type="text", onChange, placeholder, required, maxLength, icon: Icon, error, disabled, hint, theme }) => {
  const [showPassword, setShowPassword] = useState(false);
  const displayValue = value === "ไม่มีให้ใส่ -" ? "" : value;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-box ${Icon ? 'has-icon' : ''}`}>
      {label && <label className="label-text">{label} {required && <span className="required-star">*</span>}</label>}
      <div className="relative">
        <input 
          type={inputType} name={name} value={displayValue} onChange={onChange} placeholder={placeholder} maxLength={maxLength} required={required} disabled={disabled}
          className={`${error ? 'border-red-500 bg-red-50' : ''}`}
        />
        {Icon && (
          <i className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300" 
              style={{
                color: theme === 'dark' ? 'var(--text-dark)' : 'var(--text-light)', 
                opacity: theme === 'dark' ? 0.8 : 0.5 
              }}>
            <Icon size={18} />
          </i>
        )}
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 transition-colors">
              <div className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
          </button>
        )}
      </div>
      {hint && !error && <p className="text-[10px] text-gray-400 mt-1 text-left">{hint}</p>}
      {error && <p className="text-red-500 text-[10px] mt-1 font-medium text-left">{error}</p>}
    </div>
  );
};

export const CustomCombobox = ({ label, name, value, onChange, options, placeholder, required, disabled, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const displayValue = value === "ไม่มีให้ใส่ -" ? "" : value;

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        onChange(e); 
    };

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setSearchTerm(''); 
        setIsOpen(false);
    };

    const bgColor = theme === 'dark' ? 'var(--input-bg-dark)' : 'var(--input-bg-light)';
    const textColor = theme === 'dark' ? 'var(--text-dark)' : 'var(--text-light)';
    const borderColor = theme === 'dark' ? 'var(--input-border-dark)' : 'var(--input-border-light)';

    return (
        <div className="select-wrapper" ref={wrapperRef}>
             {label && <label className="label-text">{label} {required && <span className="required-star">*</span>}</label>}
             <div className="relative">
                 <input
                    type="text" name={name} value={displayValue} onChange={handleInputChange} onClick={() => !disabled && setIsOpen(true)}
                    placeholder={placeholder || "พิมพ์หรือเลือก..."} required={required} disabled={disabled} autoComplete="off"
                    className="w-full p-2.5 rounded-xl border outline-none text-sm pr-8" 
                    style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={14}/></div>
                  {isOpen && !disabled && (
                      <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto custom-dropdown-scroll rounded-lg border shadow-lg"
                           style={{ backgroundColor: bgColor, borderColor: borderColor, color: textColor }}>
                           <div className="py-1">
                               {filteredOptions.length > 0 ? (
                                   filteredOptions.map((opt, i) => (
                                        <div key={i} onClick={() => handleSelect(opt)} 
                                             className="px-3 py-2 cursor-pointer text-sm transition-colors hover:opacity-80"
                                             style={{ borderBottom: `1px solid ${borderColor}` }}
                                        >
                                             {opt}
                                        </div>
                                   ))
                               ) : (<div className="px-3 py-2 text-sm text-gray-400 text-center">ไม่พบข้อมูล</div>)}
                           </div>
                      </div>
                  )}
             </div>
        </div>
    );
};

export const ThemeToggle = ({ theme, setTheme, style }) => {
  const toggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme); document.body.className = newTheme; 
  };
  return (
    <div className={`theme-switch ${theme}`} onClick={toggle} style={style}>
      <Sun size={18} className="text-slate-400 ml-1" />
      <Moon size={18} className="text-slate-400 mr-1" />
      <div className="theme-knob">
        {theme === 'light' ? <Sun size={16} className="text-white"/> : <Moon size={16} className="text-white"/>}
      </div>
    </div>
  );
};