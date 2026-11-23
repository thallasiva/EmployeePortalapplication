const FREQ_OPTS = ["Daily", "Weekly", "Monthly", "Yearly", "Custom Cron"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLANK = {
  name: "",
  freq: "Daily",
  send_time: "08:00",
  template_name: "",
  recipient: "",
  cron_expr: "",
  status: "Active"
};
export { FREQ_OPTS, DAYS_SHORT, BLANK };
