import React from 'react';
import { GraduationCap, Users } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { APP_PRODUCTS, AppProduct } from '../../types/product';

export const PRODUCT_ICON: Record<AppProduct, React.ComponentType<{ className?: string }>> = {
  HRMS: Users,
  MyCPE: GraduationCap,
};

/**
 * Prototype-only: HRMS / MyCPE switch for phones (the desktop studio has the same switch in its toolbar).
 */
export const ProductSwitcher: React.FC = () => {
  const { product, onSwitchProduct } = useProduct();
  return (
    <div role="radiogroup" aria-label="View this app as" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100">
      {APP_PRODUCTS.map((p) => {
        const Icon = PRODUCT_ICON[p];
        const on = p === product;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => !on && onSwitchProduct(p)}
            className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${
              on ? 'bg-white text-[#1E1B4B] shadow-2xs' : 'text-slate-500 active:bg-white/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {p}
          </button>
        );
      })}
    </div>
  );
};
