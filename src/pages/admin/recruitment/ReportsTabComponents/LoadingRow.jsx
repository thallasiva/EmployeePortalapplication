import { RefreshCw } from "lucide-react";
function LoadingRow() {
  return <div className="flex items-center justify-center py-12 text-gray-400 gap-2 text-sm">
      <RefreshCw size={16} className="animate-spin" /> Loading…
    </div>;
}
export { LoadingRow };
