import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { APP_PRODUCTS, AppProduct } from '../../types/product';
import { PRODUCT_ICON } from './ProductSwitcher';

const TILE: Record<AppProduct, string> = {
  HRMS: 'bg-[#2F68FE]',
  MyCPE: 'bg-[#1E1B4B]',
};

/** First screen: pick which product to view. One tap opens it. */
export const ProductChooser: React.FC = () => {
  const { onSwitchProduct } = useProduct();
  return (
    <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar px-6 py-8 bg-white text-[#1E1B4B] select-none">
      <img src="/brand/Logo.png" alt="MYCPE ONE" className="w-28 mx-auto" draggable={false} />
      <h1 className="mt-10 text-center text-2xl font-bold tracking-tight">View this app as</h1>
      <div className="mt-6 space-y-3">
        {APP_PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICON[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSwitchProduct(p)}
              className="w-full h-20 px-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 text-left shadow-2xs active:bg-slate-50 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <span className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0 ${TILE[p]}`}>
                <Icon className="w-6 h-6" />
              </span>
              <span className="flex-1 text-lg font-bold">{p}</span>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
