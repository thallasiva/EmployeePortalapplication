import React from "react";
import { CheckCircle2, Hourglass, ListFilter } from "lucide-react";
const TABS = [{
  key: "all",
  label: "All",
  icon: <ListFilter size={13} />
}, {
  key: "pending",
  label: "Pending",
  icon: <Hourglass size={13} />
}, {
  key: "decided",
  label: "Decided",
  icon: <CheckCircle2 size={13} />
}];
export { TABS };
