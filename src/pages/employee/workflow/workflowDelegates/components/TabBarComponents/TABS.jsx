import React from "react";
import { GitBranch, Users } from "lucide-react";
const TABS = [{
  key: "mine",
  label: "My Delegates",
  icon: <GitBranch size={14} />
}, {
  key: "delegated",
  label: "Delegated to Me",
  icon: <Users size={14} />
}];
export { TABS };
