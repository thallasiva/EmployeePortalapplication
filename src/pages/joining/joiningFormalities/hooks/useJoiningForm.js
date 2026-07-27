import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { verifyJoiningToken, getJoiningForm, saveJoiningFormalities } from "../../../../api/joining.api";
import { INITIAL_FORM } from "../constants";
import { validateTab, buildPayload, hydrateFormFromSaved } from "../utils/formUtils";

export function useJoiningForm() {
  const { token } = useParams();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visited, setVisited] = useState(new Set([0]));
  const [validErrs, setValidErrs] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  const set = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }, []);

  useEffect(() => {
    if (!token) {
      setError("No invitation token found in URL.");
      setLoading(false);
      return;
    }
    verifyJoiningToken(token)
      .then(async (data) => {
        setInv(data);
        if (["submitted", "pending_verification", "approved"].includes(data.formality_status)) {
          setSubmitted(true);
          setLoading(false);
          return;
        }
        const invName = data.candidate_name || "";
        const invEmail = data.candidate_email || "";
        const invMobile = data.candidate_mobile || "";
        if (!data.formality_id) {
          setForm((p) => ({
            ...p,
            fullName: invName, pfEmail: invEmail, pfMobileNo: invMobile,
            tlEmployeeName: invName, tlDeclarationEmployeeName: invName,
            gratuityEmployeeIntroName: invName, gratuityEmployeeStatementNameAndAddress: invName,
            insEmployeeName: invName, insDeclarationEmployeeName: invName, pfEmployeeName: invName
          }));
          setLoading(false);
          return;
        }
        if (data.formality_id) {
          try {
            const saved = await getJoiningForm(token);
            if (saved) {
              setForm((p) => hydrateFormFromSaved(saved, invName, invEmail, invMobile, p));
            }
          } catch {}
        }
      })
      .catch((err) =>
        setError(err?.response?.data?.message || "This link is invalid or has expired.")
      )
      .finally(() => setLoading(false));
  }, [token]);

  const saveDraft = useCallback(async () => {
    try {
      await saveJoiningFormalities(buildPayload(form, token, false));
    } catch {}
  }, [form, token]);

  const goTo = useCallback(
    async (idx) => {
      if (idx > tab) {
        const errs = validateTab(tab, form);
        if (errs.length > 0) {
          setValidErrs(errs);
          window.scrollTo(0, 0);
          return;
        }
      }
      setValidErrs([]);
      await saveDraft();
      setTab(idx);
      setVisited((v) => new Set([...v, idx]));
      window.scrollTo(0, 0);
    },
    [tab, form, saveDraft]
  );

  const handleSubmit = useCallback(async () => {
    const allErrs = [6, 5, 4, 3, 2, 1, 0].flatMap((t) => validateTab(t, form));
    if (!form.handbookAcknowledged) allErrs.unshift("Please acknowledge the Employee Handbook.");
    if (!form.hrPolicyAcknowledged) allErrs.unshift("Please acknowledge the HR Policy Manual.");
    if (allErrs.length > 0) {
      setValidErrs(allErrs);
      window.scrollTo(0, 0);
      return;
    }
    setSaving(true);
    try {
      await saveJoiningFormalities(buildPayload(form, token, true));
      setSubmitted(true);
    } catch (err) {
      setValidErrs([err?.response?.data?.message || "Submission failed. Please try again."]);
    } finally {
      setSaving(false);
    }
  }, [form, token]);

  return {
    inv, loading, error, tab, saving, submitted, visited, validErrs,
    form, set, setForm, goTo, handleSubmit
  };
}
