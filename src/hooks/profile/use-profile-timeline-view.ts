import { useEffect, useMemo, useState } from "react";
import type { TimelineItem } from "@/components/profile/profile-timeline";
import {
  PROFILE_TIMELINE_DEFAULT_LIMIT,
  type TimelineRecord,
} from "./profile-timeline-utils";

type UseProfileTimelineViewArgs = {
  timelineRecords: TimelineRecord[];
  resetKey: number | null;
};

export function useProfileTimelineView({
  timelineRecords,
  resetKey,
}: UseProfileTimelineViewArgs) {
  const [showTimelineHistory, setShowTimelineHistory] = useState(false);

  useEffect(() => {
    setShowTimelineHistory(false);
  }, [resetKey]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const scopedRecords = showTimelineHistory
      ? timelineRecords
      : timelineRecords.slice(0, PROFILE_TIMELINE_DEFAULT_LIMIT);
    return scopedRecords.map(({ id, type, title, detail, date }) => ({
      id,
      type,
      title,
      detail,
      date,
    }));
  }, [timelineRecords, showTimelineHistory]);

  const canToggleTimelineHistory = timelineRecords.length > 0;
  const timelineActionLabel = showTimelineHistory ? "Ver menos" : "Ver más";
  const handleToggleTimelineHistory = () => {
    setShowTimelineHistory((prev) => !prev);
  };

  return {
    timelineItems,
    canToggleTimelineHistory,
    timelineActionLabel,
    handleToggleTimelineHistory,
  };
}
