import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TacticalInput = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    icon: Icon,
    isTextArea = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative group">
            {/* Label */}
            <label className={`absolute left-4 transition-all duration-200 pointer-events-none font-mono text-xs tracking-wider z-10
                ${isFocused || value ? '-top-2.5 bg-[#0A0A0F] px-2 text-[var(--legion-gold)]' : 'top-4 text-gray-500'}
            `}>
                {label}
            </label>

            {/* Input Container */}
            <div className={`relative bg-white/5 border transition-all duration-300 rounded-lg overflow-hidden
                ${isFocused ? 'border-[var(--legion-gold)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-white/10 hover:border-white/20'}
            `}>

                {/* Element */}
                {isTextArea ? (
                    <textarea
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-transparent text-white px-4 py-4 pt-5 outline-none font-sans min-h-[120px] resize-none"
                        placeholder={isFocused ? placeholder : ""}
                        {...props}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-transparent text-white px-4 py-4 pt-5 outline-none font-sans"
                        placeholder={isFocused ? placeholder : ""}
                        {...props}
                    />
                )}

                {/* Right Icon */}
                {Icon && (
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-[var(--legion-gold)]' : 'text-gray-500'}`}>
                        <Icon size={18} />
                    </div>
                )}
            </div>

            {/* Corner Decorators (Visual Fluff) */}
            <div className={`absolute -bottom-px -left-px w-2 h-2 border-b border-l transition-colors duration-300 ${isFocused ? 'border-[var(--legion-gold)]' : 'border-transparent'}`} />
            <div className={`absolute -top-px -right-px w-2 h-2 border-t border-r transition-colors duration-300 ${isFocused ? 'border-[var(--legion-gold)]' : 'border-transparent'}`} />
        </div>
    );
};

export default TacticalInput;
