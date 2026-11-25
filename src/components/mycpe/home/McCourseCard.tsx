import React from 'react';
import { Bookmark, Star } from 'lucide-react';
import { EBookIcon, LiveWebinarIcon, OnDemandIcon, PodcastIcon, ApprovedIcon } from '../common/McIcons';
import { CourseType, McCourse } from '../data/mycpeHomeData';

const TYPE_ICON: Record<CourseType, React.ComponentType<{ className?: string }>> = {
  'On-Demand': OnDemandIcon,
  Podcasts: PodcastIcon,
  'E-Books': EBookIcon,
  'Upcoming Webinar': LiveWebinarIcon,
};

const TAG = 'h-[21px] px-1 rounded-[4px] border border-[#B8B0F5] bg-mc-primary-tint text-[10px] font-medium text-mc-indigo flex items-center gap-0.5 whitespace-nowrap';

export const McCourseCard: React.FC<{
  course: McCourse;
  bookmarked: boolean;
  onBookmark: () => void;
  onOpen: () => void;
}> = ({ course: c, bookmarked, onBookmark, onOpen }) => {
  const Icon = TYPE_ICON[c.type];
  const inProgress = c.progress !== undefined;
  return (
    <article className={`relative w-[196px] shrink-0 rounded-xl bg-white overflow-hidden flex flex-col ${inProgress ? 'shadow-[inset_0_0_0_1px_#EAECF0]' : ''}`}>
      <button type="button" onClick={onOpen} className="flex-1 flex flex-col text-left cursor-pointer" aria-label={c.title}>
        <img src={c.image} alt="" className="block w-full h-28 object-cover" draggable={false} />
        <span className={`block w-full ${inProgress ? 'px-2 pb-4' : 'px-3 pb-[15px]'}`}>
          <span className="h-[34px] mt-1 flex items-center gap-1.5 text-[10.5px] text-mc-muted">
            <Icon className="w-3.5 h-3.5 text-[#2B1E9C]" />
            {c.type}
          </span>
          <span className="block text-xs leading-[18px] font-semibold text-[#2A3343] line-clamp-2 min-h-9">{c.title}</span>
          {inProgress ? (
            <span className={`mt-2 block h-1 rounded-full overflow-hidden ${c.progressTone === 'gold' ? 'bg-[#F5E8C0]' : 'bg-[#E4E7EC]'}`}>
              <span className={`block h-full rounded-full ${c.progressTone === 'gold' ? 'bg-[#EBC54D]' : 'bg-mc-muted'}`} style={{ width: `${c.progress}%` }} />
            </span>
          ) : (
            <span className="mt-2 flex items-center text-xs leading-[18px] text-[#2A3343]">
              {c.credits} Credits
              <span className="mx-2 w-1 h-1 rounded-full bg-mc-muted" />
              <Star className="w-3.5 h-3.5 mr-1.5 fill-[#F2B90D] text-[#F2B90D]" />
              {c.rating}
            </span>
          )}
          {c.approvedFor && (
            <span className="mt-1.5 pt-2 block border-t border-mc-line">
              <span className="block text-xs leading-[18px] text-[#2A3343]">Approved for</span>
              <span className="mt-1 flex gap-2">
                {c.approvedFor.map((q) => (
                  <span key={q} className={TAG}>
                    <ApprovedIcon className="w-3 h-3" />
                    {q}
                  </span>
                ))}
                {c.approvedMore ? <span className={TAG}>+{c.approvedMore} More</span> : null}
              </span>
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        onClick={onBookmark}
        className={`absolute top-28 w-9 h-[42px] flex items-center justify-center cursor-pointer ${inProgress ? 'right-0' : 'right-[3px]'}`}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        aria-pressed={bookmarked}
      >
        <Bookmark className={`w-4 h-[18px] stroke-[1.5] text-mc-primary ${bookmarked ? 'fill-mc-primary' : ''}`} />
      </button>
    </article>
  );
};
