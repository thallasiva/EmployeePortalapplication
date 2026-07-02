import { Filter, Plus, UserPlus } from "lucide-react";
import Btn from "./Btn";

function Toolbar({ role, setActive })
{
    if (role.id === 1) return null;
    return (
        <div className="flex gap-2">
            {role.id === 4 && <Btn onClick={() => setActive("requirements")}><Filter size={13} /> Filter</Btn>}
            {role.id === 4 && <Btn primary onClick={() => setActive("requirements")}><Plus size={14} /> New Job Request</Btn>}
            {role.id === 5 && <Btn primary onClick={() => setActive("candidates")}><UserPlus size={14} /> Add Candidate Details</Btn>}
        </div>
    );
}

export default Toolbar;