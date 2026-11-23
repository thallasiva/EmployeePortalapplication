import React from "react";
import { Loader2 } from "lucide-react";
const Loading = () => <div className="flex items-center justify-center py-12 text-slate-400" role="status">
    <Loader2 className="animate-spin" size={22} />
    <span className="sr-only">Loading</span>
  </div>;
export { Loading };
