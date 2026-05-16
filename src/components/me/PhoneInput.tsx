import React from "react";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({ value, onChange, placeholder = "06 12 34 56 78", className = "" }: PhoneInputProps) {
  
  const formatPhone = (val: string) => {
    // Remove all non-digits
    const cleaned = val.replace(/\D/g, "");
    
    // Split into groups of 2
    const groups = cleaned.match(/.{1,2}/g);
    
    if (!groups) return cleaned;
    
    // Join with spaces, max 5 groups (10 digits)
    return groups.slice(0, 5).join(" ");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhone(rawValue);
    onChange(formatted);
  };

  return (
    <div className={`relative group ${className}`}>
      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 size-6 group-focus-within:text-primary transition-colors" />
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-[#111113] border-2 border-transparent focus:border-primary/50 rounded-[28px] py-6 pl-16 pr-8 text-2xl font-black text-white placeholder-slate-700 outline-none transition-all shadow-inner"
      />
    </div>
  );
}
