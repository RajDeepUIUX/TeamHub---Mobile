import React from 'react';
import { ArrowRight, Clock, FileText, Lock, MessageSquareText, Save, Target } from 'lucide-react';
import {
  ClientSurvey,
  RATING_SCALE,
  SURVEY_CONFIDENTIALITY,
  SURVEY_INTRO,
  SURVEY_START_LABEL,
  SURVEY_TYPE_LABEL,
  daysLeft,
} from '../data/clientFeedbackData';
import { Card, FieldGrid } from '../staff/tabs/StaffTabParts';
import { RATING_TONE, SurveyScreenHeader, SurveyTypeIcon } from './SurveyParts';

/** Desktop survey landing page (Purpose, Confidentiality, rating scale, instructions) → Start */
export const SurveyIntroView: React.FC<{ survey: ClientSurvey; onBack: () => void; onStart: () => void }> = ({ survey, onBack, onStart }) => {
  if (survey.type === 'hbr') return null;
  const intro = SURVEY_INTRO[survey.type];
  const left = daysLeft(survey);

  const instructions = [
    { icon: Clock, text: 'It will take less than 5 minutes to complete the survey.' },
    { icon: FileText, text: 'Upon submitting the survey, you will receive a summary report of your responses for your records.' },
    {
      icon: MessageSquareText,
      text: 'If possible, please provide examples or specific comments along with your ratings. Constructive feedback helps us recognize strengths and identify areas for growth.',
    },
    { icon: Save, text: 'Your answers are saved as you go, so you can come back and resume before the survey expires.' },
    ...(intro.halfYearly && survey.period
      ? [{ icon: Target, text: `We are conducting this survey half-yearly, and this one covers the period from ${survey.period}.` }]
      : []),
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] text-[#1E293B] overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <SurveyScreenHeader title={SURVEY_TYPE_LABEL[survey.type]} backLabel="Back to Feedback & Evaluation" onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <SurveyTypeIcon type={survey.type} size="lg" />
            <div className="min-w-0">
              <h2 className="text-[15px] font-extrabold leading-snug">{SURVEY_TYPE_LABEL[survey.type]}</h2>
              <p className={`text-[11.5px] font-semibold ${left <= 5 ? 'text-[#D97706]' : 'text-slate-500'}`}>
                Expires in {left} {left === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
          <FieldGrid
            compact
            fields={[
              { label: 'Staff Name', value: survey.staffName },
              { label: 'Assigned To', value: survey.assignedTo },
              { label: 'Period', value: survey.period },
            ]}
          />
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#1D4ED8]">Purpose</h3>
          <p className="mt-1.5 text-[12.5px] text-slate-600 leading-relaxed">{intro.purpose}</p>
          <div className="mt-3 flex gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Confidentiality: </strong>
              {SURVEY_CONFIDENTIALITY}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#1D4ED8]">How to rate</h3>
          <p className="mt-1 text-[11.5px] text-slate-500">
            {survey.type === 'service' ? 'Please provide ratings for each question as below.' : 'Please provide ratings to staff members for each question as below.'}
          </p>
          <ul className="mt-3 space-y-1.5">
            {RATING_SCALE.map((o) => (
              <li key={o.value} className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center tabular-nums ${RATING_TONE[o.value].dot}`}>
                  {o.value}
                </span>
                <span className="text-xs font-semibold text-slate-700">{o.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#1D4ED8]">Information & Instructions</h3>
          <ul className="mt-2.5 space-y-2.5">
            {instructions.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2F68FE] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[12px] text-slate-600 leading-relaxed pt-1">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 pt-3 border-t border-slate-100 text-[11.5px] text-slate-500 leading-relaxed">
            We appreciate your time in helping us evaluate and improve our team’s performance and service quality. Your feedback is vital in ensuring we
            deliver the best possible experience.
          </p>
        </Card>
      </div>

      <div className="px-4 pt-3 pb-3 bg-white border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
        <button
          type="button"
          onClick={onStart}
          className="w-full h-12 rounded-xl bg-[#2F68FE] text-white text-sm font-bold flex items-center justify-center gap-2 active:bg-[#1D4ED8] cursor-pointer"
        >
          {SURVEY_START_LABEL[survey.type]} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
