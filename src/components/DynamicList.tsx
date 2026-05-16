import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface DynamicListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  type?: string;
}

export default function DynamicList({ label, items, onChange, placeholder, type = "text" }: DynamicListProps) {
  const handleAdd = () => {
    onChange([...items, ""]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
        <button 
          type="button" 
          onClick={handleAdd}
          className="text-primary hover:text-primary/70 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 group">
            <input
              type={type}
              value={item}
              placeholder={placeholder}
              onChange={(e) => handleChange(index, e.target.value)}
              className="flex-1 bg-surface-container-highest border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-3 text-slate-600 hover:text-error transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-[10px] text-slate-600 italic px-1">Aucun élément ajouté.</p>
        )}
      </div>
    </div>
  );
}
