import { useEffect, useMemo, useState } from "react";
import type { TimelineItem } from "@/components/profile/profile-timeline";
import {
  PROFILE_TIMELINE_DEFAULT_LIMIT,
  PROFILE_TIMELINE_HISTORY_HOURS,
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
    const now = Date.now();
    const from72h = now - PROFILE_TIMELINE_HISTORY_HOURS * 60 * 60 * 1000;
    const scopedRecords = showTimelineHistory
      ? timelineRecords.filter((record) => record.timestamp >= from72h)
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
