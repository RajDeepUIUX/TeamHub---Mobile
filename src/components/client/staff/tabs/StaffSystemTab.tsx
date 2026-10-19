import React, { useState } from 'react';
import { KeyRound, Laptop, Monitor, Headphones, Keyboard } from 'lucide-react';
import { SegmentedTabs } from '../../../../design-system/components/SegmentedTabs';
import { formatStaffDate } from '../../data/clientStaffData';
import type { AssignedDevice, SystemAccess } from '../../data/clientStaffProfileData';
import { Card, EmptyCard, FieldGrid, Pill, TabTitle } from './StaffTabParts';

type View = 'devices' | 'access';

const DEVICE_ICON: Record<string, React.ElementType> = { Laptop, Monitor, Headset: Headphones, 'Keyboard & Mouse': Keyboard };

/** Desktop "System & IT Details" tab (system_details.tpl): Assigned Devices + System Access */
export const StaffSystemTab: React.FC<{ devices: AssignedDevice[]; access: SystemAccess[] }> = ({ devices, access }) => {
  const [view, setView] = useState<View>('devices');

  return (
    <>
      <TabTitle title="System & IT Details" />
      <div className="mt-2.5">
        <SegmentedTabs<View>
          ariaLabel="System details"
          options={[
            { id: 'devices', label: `Assigned Devices (${devices.length})` },
            { id: 'access', label: `System Access (${access.length})` },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      <div className="mt-3">
        {view === 'devices' ? (
          devices.length === 0 ? (
            <EmptyCard icon={Laptop} title="No devices assigned." />
          ) : (
            <ul className="space-y-2.5">
              {devices.map((d) => {
                const Icon = DEVICE_ICON[d.assetGroup] ?? Laptop;
                return (
                  <li key={d.id}>
                    <Card className="p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#1E293B] truncate">
                            {d.assetGroup} · {d.brand}
                          </p>
                          <p className="text-[11px] text-slate-400 tabular-nums">{d.assetCode}</p>
                        </div>
                        <Pill tone={d.status === 'Assigned' ? 'green' : 'slate'}>{d.status}</Pill>
                      </div>
                      <FieldGrid
                        compact
                        fields={[
                          { label: 'Desk No', value: d.deskNo },
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
          <EmptyCard icon={KeyRound} title="No system access given." />
        ) : (
          <ul className="space-y-2.5">
            {access.map((a) => (
              <li key={a.id}>
                <Card className="p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <p className="flex-1 min-w-0 text-[13px] font-bold text-[#1E293B] truncate">{a.software}</p>
                    <Pill tone={a.status === 'Active' ? 'green' : 'slate'}>{a.status}</Pill>
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
