import React, { useState } from 'react';
import { KeyRound, Laptop, Monitor, Headphones, Keyboard } from 'lucide-react';
import { SegmentedTabs } from '../../../../design-system/components/SegmentedTabs';
import { formatStaffDate } from '../../data/clientStaffData';
import type { AssignedDevice, SystemAccess } from '../../data/clientStaffProfileData';
import { ACCENT, AccentCard, Card, EmptyCard, FieldGrid, Pill, RowList, SwitchTiles, Tone } from './StaffTabParts';

type View = 'devices' | 'access';

const DEVICE_ICON: Record<string, React.ElementType> = { Laptop, Monitor, Headset: Headphones, Headphones, 'Keyboard & Mouse': Keyboard };

/** Card heading: desktop column label above its value */
const LabeledValue: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex-1 min-w-0">
    <p className="text-[10.5px] text-slate-400">{label}</p>
    <p className="mt-0.5 text-[13px] font-bold text-[#1E293B] truncate tabular-nums">{value}</p>
  </div>
);

const StatusCell: React.FC<{ tone: Tone; status: string }> = ({ tone, status }) => (
  <div className="shrink-0 text-right">
    <p className="text-[10.5px] text-slate-400">Status</p>
    <div className="mt-0.5">
      <Pill tone={tone}>{status}</Pill>
    </div>
  </div>
);

/** Desktop "System & IT Details" tab (system_details.tpl): Assigned Devices + System Access */
export const StaffSystemTab: React.FC<{ devices: AssignedDevice[]; access: SystemAccess[]; v2?: boolean }> = ({ devices, access, v2 }) => {
  const [view, setView] = useState<View>('devices');

  if (v2) {
    const head = (Icon: React.ElementType, iconTint: string, label: string, value: string, tone: Tone, status: string) => (
      <div className="flex items-center gap-3">
        <span className={`w-11 h-11 rounded-2xl bg-[#F8FAFC] border border-[#EBF0F7] flex items-center justify-center shrink-0 ${iconTint}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] text-slate-400">{label}</p>
          <p className="text-[14px] font-bold text-[#1E293B] truncate tabular-nums">{value}</p>
        </div>
        <Pill tone={tone}>{status}</Pill>
      </div>
    );
    return (
      <>
        <div className="mt-2.5">
          <SwitchTiles<View>
            label="System details"
            options={[
              { id: 'devices', label: 'Assigned Devices', icon: Laptop, count: devices.length },
              { id: 'access', label: 'System Access', icon: KeyRound, count: access.length },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
        <div className="mt-3">
          {view === 'devices' ? (
            devices.length === 0 ? (
              <EmptyCard icon={Laptop} title="No Data Found" />
            ) : (
              <ul className="space-y-2.5">
                {devices.map((d) => {
                  const tone: Tone = d.status === 'Assigned' ? 'green' : 'slate';
                  return (
                    <li key={d.id}>
                      <AccentCard accent={ACCENT[tone]} className="pl-4 pr-3.5 pt-3.5 pb-1">
                        {head(DEVICE_ICON[d.assetGroup] ?? Laptop, 'text-[#2F68FE]', 'Asset Code', d.assetCode, tone, d.status)}
                        <RowList
                          className="mt-2.5 border-t border-slate-100"
                          rows={[
                            { label: 'Asset Group', value: d.assetGroup },
                            { label: 'Desk No', value: d.deskNo },
                            { label: 'Asset Brand', value: d.brand },
                            { label: 'Date of Assignment', value: formatStaffDate(d.assignedOn) },
                          ]}
                        />
                      </AccentCard>
                    </li>
                  );
                })}
              </ul>
            )
          ) : access.length === 0 ? (
            <EmptyCard icon={KeyRound} title="No Data Found" />
          ) : (
            <ul className="space-y-2.5">
              {access.map((a) => {
                const tone: Tone = a.status === 'Active' ? 'green' : 'slate';
                return (
                  <li key={a.id}>
                    <AccentCard accent={ACCENT[tone]} className="pl-4 pr-3.5 pt-3.5 pb-1">
                      {head(KeyRound, 'text-[#4F46E5]', 'Software Name', a.software, tone, a.status)}
                      <RowList
                        className="mt-2.5 border-t border-slate-100"
                        rows={[
                          { label: 'Email Linked', value: <span className="break-all">{a.email}</span>, wide: true },
                          { label: 'Date Of Assigning', value: formatStaffDate(a.assignedOn) },
                        ]}
                      />
                    </AccentCard>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </>
    );
  }

  return (
    <>
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
