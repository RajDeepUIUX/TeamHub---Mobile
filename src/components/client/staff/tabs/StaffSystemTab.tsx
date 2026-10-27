import React, { useState } from 'react';
import { KeyRound, Laptop, Monitor, Headphones, Keyboard } from 'lucide-react';
import { formatStaffDate } from '../../data/clientStaffData';
import type { AssignedDevice, SystemAccess } from '../../data/clientStaffProfileData';
import { Card, EmptyCard, FieldGrid, Pill, Tone } from './StaffTabParts';

type View = 'devices' | 'access';

const DEVICE_ICON: Record<string, React.ElementType> = { Laptop, Monitor, Headset: Headphones, Headphones, 'Keyboard & Mouse': Keyboard };

/** Card heading: desktop column label above its value */
const LabeledValue: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex-1 min-w-0">
    <p className="text-[11px] text-slate-400">{label}</p>
    <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] truncate tabular-nums">{value}</p>
  </div>
);

const StatusCell: React.FC<{ tone: Tone; status: string }> = ({ tone, status }) => (
  <div className="shrink-0 self-center">
    <Pill tone={tone}>{status}</Pill>
  </div>
);

/** Desktop "System & IT Details" tab (system_details.tpl): Assigned Devices + System Access */
export const StaffSystemTab: React.FC<{ devices: AssignedDevice[]; access: SystemAccess[] }> = ({ devices, access }) => {
  const [view, setView] = useState<View>('devices');

  return (
    <>
      <div
        className="mt-2.5 grid grid-cols-2 bg-white rounded-2xl border border-[#EBF0F7] shadow-2xs overflow-hidden"
        role="tablist"
        aria-label="System details"
      >
        {([
          { id: 'devices', label: 'Assigned Devices', count: devices.length },
          { id: 'access', label: 'System Access', count: access.length },
        ] as const).map((t) => {
          const on = t.id === view;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(t.id)}
              className={`relative h-12 px-3 flex items-center justify-center gap-1.5 text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2F68FE] ${
                on ? 'text-[#2F68FE]' : 'text-slate-500 active:text-[#1E293B]'
              }`}
            >
              {t.label}
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                  on ? 'bg-[#2F68FE] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t.count}
              </span>
              <span
                aria-hidden="true"
                className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE] transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {view === 'devices' ? (
          devices.length === 0 ? (
            <EmptyCard icon={Laptop} title="No Data Found" />
          ) : (
            <ul className="space-y-2.5">
              {devices.map((d) => {
                const Icon = DEVICE_ICON[d.assetGroup] ?? Laptop;
                return (
                  <li key={d.id}>
                    <Card className="p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <LabeledValue label="Asset Code" value={d.assetCode} />
                        <StatusCell tone={d.status === 'Assigned' ? 'green' : 'slate'} status={d.status} />
                      </div>
                      <FieldGrid
                        compact
                        fields={[
                          { label: 'Asset Group', value: d.assetGroup },
                          { label: 'Desk No', value: d.deskNo },
                          { label: 'Asset Brand', value: d.brand },
                          { label: 'Date of Assignment', value: formatStaffDate(d.assignedOn) },
                        ]}
                      />
                    </Card>
                  </li>
                );
              })}
            </ul>
          )
        ) : access.length === 0 ? (
          <EmptyCard icon={KeyRound} title="No Data Found" />
        ) : (
          <ul className="space-y-2.5">
            {access.map((a) => (
              <li key={a.id}>
                <Card className="p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <LabeledValue label="Software Name" value={a.software} />
                    <StatusCell tone={a.status === 'Active' ? 'green' : 'slate'} status={a.status} />
                  </div>
                  <FieldGrid
                    compact
                    fields={[
                      { label: 'Email Linked', value: a.email, wide: true },
                      { label: 'Date Of Assigning', value: formatStaffDate(a.assignedOn) },
                    ]}
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
