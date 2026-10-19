import React, { useState } from 'react';
import { BadgeCheck, Download, Eye, FileText, FolderOpen } from 'lucide-react';
import { BottomSheet } from '../../../common/BottomSheet';
import type { StaffDocument, StaffDocumentGroup } from '../../data/clientStaffProfileData';
import { Card, EmptyCard, SheetHeader, TabTitle, useNotice } from './StaffTabParts';
import { useClientPermission } from '../../context/ClientPermissionContext';

const GROUPS: StaffDocumentGroup[] = ['Employee Document', 'Government Documents', 'Background Verification'];

/** Desktop "Employee Documents" tab (employee_document.tpl): grouped files with verified tick, view / download */
export const StaffDocumentsTab: React.FC<{ documents: StaffDocument[]; staffName: string }> = ({ documents, staffName }) => {
  const { download: canDownload } = useClientPermission('my-staff');
  const [open, setOpen] = useState<StaffDocument | null>(null);
  const [notice, showNotice] = useNotice();

  const download = (d: StaffDocument) => {
    setOpen(null);
    showNotice(`${d.name} downloaded.`);
  };

  return (
    <>
      {notice}
      <TabTitle title="Employee Document" />
      {documents.length === 0 ? (
        <div className="mt-2.5">
          <EmptyCard icon={FolderOpen} title="No documents uploaded yet." />
        </div>
      ) : (
        GROUPS.map((group) => {
          const docs = documents.filter((d) => d.group === group);
          if (docs.length === 0) return null;
          return (
            <div key={group} className="mt-3">
              <h4 className="px-1 text-sm font-bold text-[#1D4ED8]">{group}</h4>
              <Card className="mt-2 overflow-hidden">
                <ul>
                  {docs.map((d, idx) => (
                    <li key={d.id} className={idx < docs.length - 1 ? 'border-b border-slate-100' : ''}>
                      <button
                        type="button"
                        onClick={() => setOpen(d)}
                        className="w-full px-3.5 py-3 flex items-center gap-3 text-left active:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-rose-500 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#1E293B]">
                            <span className="truncate">{d.name}</span>
                            {d.verified && <BadgeCheck className="w-4 h-4 text-[#10B981] shrink-0" aria-label="Verified" />}
                          </span>
                          <span className="block text-[11px] text-slate-400 truncate">{d.fileName}</span>
                        </span>
                        <span className="w-9 h-9 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0" aria-hidden="true">
                          <Eye className="w-4 h-4" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          );
        })
      )}

      <BottomSheet isOpen={open !== null} onClose={() => setOpen(null)} maxHeight="max-h-[70%]">
        <SheetHeader title={open?.name ?? ''} subtitle={staffName} onClose={() => setOpen(null)} />
        {open && (
          <div className="px-5 py-5 flex flex-col items-center text-center">
            <span className="w-20 h-24 rounded-xl bg-[#FEF2F2] border border-rose-100 text-rose-500 flex flex-col items-center justify-center gap-1">
              <FileText className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase">{open.fileName.split('.').pop()?.slice(0, 4) || 'pdf'}</span>
            </span>
            <p className="mt-3 text-[13px] font-bold text-[#1E293B] break-all">{open.fileName}</p>
            <p className="mt-1 text-[11px] text-slate-400">{open.group}</p>
            {open.verified ? (
              <span className="mt-2.5 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#E8F8F0] text-[#10B981] text-[11px] font-bold">
                <BadgeCheck className="w-3.5 h-3.5" /> Document verified
              </span>
            ) : (
              <span className="mt-2.5 inline-flex items-center h-7 px-2.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">Not verified</span>
            )}
          </div>
        )}
        <div className={`grid ${canDownload ? 'grid-cols-2' : 'grid-cols-1'} gap-3 p-4 pt-3 pb-6 border-t border-slate-100 shrink-0`}>
          {canDownload && (
          <button
            type="button"
            onClick={() => open && download(open)}
            className="h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (open) showNotice(`Opening ${open.name} in a new tab.`);
              setOpen(null);
            }}
            className="h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold active:bg-[#1D4ED8] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> View
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
