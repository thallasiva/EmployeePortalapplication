import React from "react";
import { Repeat, CalendarDays, CalendarRange, Target, Settings2 } from "lucide-react";
const FREQ_EMOJI = {
  Daily: <Repeat size={20} />,
  Weekly: <CalendarDays size={20} />,
  Monthly: <CalendarRange size={20} />,
  Yearly: <Target size={20} />,
  "Custom Cron": <Settings2 size={20} />
};
export { FREQ_EMOJI };
