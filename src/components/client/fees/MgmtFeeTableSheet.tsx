import React from 'react';
import { BottomSheet } from '../../common/BottomSheet';
import { SheetHeader } from '../staff/tabs/StaffTabParts';
import { MosFeeStructure, formatFee } from '../data/clientMgmtFeeData';

interface Props {
  isOpen: boolean;
  structure: MosFeeStructure;
  /** Bracket column of the client's current team size */
  teamBracket: number;
  onClose: () => void;
}

/** Desktop table as-is: Level · US Experience · "Staff Member As Per Team Size" columns (scrolls sideways, Level column stays) */
export const MgmtFeeTableSheet: React.FC<Props> = ({ isOpen, structure, teamBracket, onClose }) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="max-h-[88%]">
    <SheetHeader title="Full fee table" subtitle="Monthly fee per staff member (USD)" onClose={onClose} />
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-3 pb-8">
      <div className="rounded-2xl border border-[#EBF0F7] overflow-x-auto no-scrollbar">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th
                rowSpan={2}
                scope="col"
                className="sticky left-0 z-10 bg-slate-50 px-2.5 py-2 text-[10.5px] font-bold text-slate-500 border-r border-[#EBF0F7] align-middle"
              >
                Level
              </th>
              <th colSpan={structure.brackets.length} scope="colgroup" className="px-2 pt-2 pb-1 text-center text-[10.5px] font-bold text-slate-500">
                Staff Member As Per Team Size
              </th>
            </tr>
            <tr className="bg-slate-50 border-b border-[#EBF0F7]">
              {structure.brackets.map((b, i) => (
                <th
                  key={b.id}
                  scope="col"
                  className={`px-1.5 last:pr-2.5 pb-2 text-right text-[10.5px] font-bold whitespace-nowrap tabular-nums ${i === teamBracket ? 'text-[#2F68FE]' : 'text-[#1E293B]'}`}
                >
                  {b.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {structure.levels.map((row) => (
              <tr key={row.level}>
                <th scope="row" className="sticky left-0 z-10 bg-white px-2.5 py-2.5 border-r border-[#EBF0F7] text-left font-normal">
                  <span className="block text-[11.5px] font-bold text-[#1E293B] whitespace-nowrap">Level {row.level}</span>
                  <span className="block text-[10px] text-slate-400 whitespace-nowrap">{row.usExperience}</span>
                </th>
                {row.fees.map((fee, i) => (
                  <td
                    key={structure.brackets[i].id}
                    className={`px-1.5 last:pr-2.5 py-2.5 text-right text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                      i === teamBracket ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'text-[#1E293B]'
                    }`}
                  >
                    {formatFee(fee)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
        <span className="w-3 h-3 rounded-[4px] bg-[#EFF6FF] border border-[#BFDBFE] shrink-0" aria-hidden="true" />
        Highlighted column = your current team size
      </p>
    </div>
  </BottomSheet>
);
