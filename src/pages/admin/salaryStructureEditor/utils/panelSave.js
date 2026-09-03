import {
  createComponent,
  updateStructure,
} from "../../../../api/salaryComponent.api";
import { getErrorMessage } from "../../../../api/client";
import { apiErrorToast, successToast, errorToast } from "../../../../utils/ToastControllers";

/**
 * Handles saving a component from the Add/Edit panel.
 * Returns true on success, false on failure.
 */
export async function executePanelSave({
  data,
  structure,
  setStructure,
  saveMeta,
  load,
  setPanelOpen,
  setEditLine,
}) {
  try {
    let componentId;

    if (data.mode === "existing") {
      componentId = data.component_id;
    } else if (data.component_id) {
      // Update existing component override on the structure
      await updateStructure(structure.structure_id, {
        structure_name: structure.structure_name,
        description: structure.description,
        is_default: structure.is_default,
        lines: [{
          component_id: data.component_id,
          calc_type_override: data.calc_type,
          percentage_override: data.calc_type === "Percentage" ? Number(data.percentage_value) : null,
          percentage_of_override: data.calc_type === "Percentage" ? data.percentage_of : null,
          formula_override: data.calc_type === "Formula" ? data.formula_expr : null,
          fixed_amount: data.calc_type === "Fixed Amount" ? Number(data.fixed_amount ?? 0) : null,
          sort_order: Number(data.sort_order) || 100,
        }],
      });
      successToast("Component updated");
      setPanelOpen(false);
      setEditLine(null);
      await load();
      return;
    } else {
      // Create brand-new master component
      const created = await createComponent({
        component_name: data.component_name,
        component_code: data.component_code,
        category: data.category,
        calc_type: data.calc_type,
        percentage_value: data.percentage_value,
        percentage_of: data.percentage_of,
        formula_expr: data.formula_expr,
        frequency: data.frequency,
        is_taxable: data.is_taxable,
        pf_applicable: data.pf_applicable,
        esi_applicable: data.esi_applicable,
        show_offer_letter: data.show_offer_letter,
        show_ctc_breakup: data.show_ctc_breakup,
        show_payslip: data.show_payslip,
        sort_order: data.sort_order,
      });
      componentId = created.component_id;
    }

    let sid = structure.structure_id;
    if (!sid) {
      const s = await saveMeta();
      sid = s.structure_id;
      setStructure((prev) => ({ ...prev, structure_id: sid }));
    }

    await updateStructure(sid, {
      structure_name: structure.structure_name,
      description: structure.description,
      is_default: structure.is_default,
      lines: [{ component_id: componentId, sort_order: Number(data.sort_order) || 100 }],
    });

    successToast("Component added");
    setPanelOpen(false);
    setEditLine(null);
    await load();
  } catch (err) {
    apiErrorToast(err, "Failed to save component");
  }
}
