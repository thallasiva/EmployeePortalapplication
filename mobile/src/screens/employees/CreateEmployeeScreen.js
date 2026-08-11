import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import DatePickerField from '../../components/DatePickerField';
import { employeeApi } from '../../api/employee.api';
import client from '../../api/client';

const unwrap = r => r.data?.data ?? r.data;

const STEPS = ['Personal', 'Employment', 'Review'];
const EMP_TYPES = ['Permanent', 'Contract', 'Intern', 'Probation'];

const Field = ({ label, value, onChangeText, placeholder, keyboardType, error, multiline, editable = true }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={fieldStyles.label}>{label}</Text>
    <TextInput
      style={[fieldStyles.input, error && fieldStyles.inputError, multiline && { height: 80, textAlignVertical: 'top' }, !editable && { backgroundColor: COLORS.gray50, color: COLORS.gray400 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      placeholderTextColor={COLORS.gray300}
      keyboardType={keyboardType || 'default'}
      multiline={multiline}
      editable={editable}
      autoCapitalize="none"
    />
    {error && <Text style={fieldStyles.errorText}>{error}</Text>}
  </View>
);

const SelectField = ({ label, value, onSelect, options, error, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TouchableOpacity style={[fieldStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, error && fieldStyles.inputError]}
        onPress={() => setOpen(!open)}>
        <Text style={{ color: selected ? COLORS.secondary : COLORS.gray300, fontSize: 14 }}>
          {selected ? selected.label : (placeholder || `Select ${label}`)}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.gray400} />
      </TouchableOpacity>
      {error && <Text style={fieldStyles.errorText}>{error}</Text>}
      {open && (
        <View style={fieldStyles.dropdown}>
          {options.map(o => (
            <TouchableOpacity key={String(o.value)} style={[fieldStyles.dropItem, String(value) === String(o.value) && fieldStyles.dropItemActive]}
              onPress={() => { onSelect(o.value); setOpen(false); }}>
              <Text style={[fieldStyles.dropText, String(value) === String(o.value) && { color: COLORS.primary, fontWeight: '700' }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, marginBottom: 6 },
  input: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray100, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.secondary },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 11, color: COLORS.danger, marginTop: 3 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray100, zIndex: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 6, marginTop: 2 },
  dropItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  dropItemActive: { backgroundColor: COLORS.primary + '10' },
  dropText: { fontSize: 14, color: COLORS.secondary },
});

const INIT = {
  first_name: '', last_name: '', email: '', mobile: '', date_of_birth: '',
  emp_code: '', emp_job_title: '', department_id: '', reporting_to: '',
  emp_joining_date: '', employee_type: 'Permanent', contract_end_date: '',
  date_of_confirmation: '',
};

function validateStep(step, v) {
  const e = {};
  if (step === 0) {
    if (!v.first_name.trim()) e.first_name = 'First name is required';
    if (!v.last_name.trim()) e.last_name = 'Last name is required';
    if (!v.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Invalid email';
    if (!v.mobile.trim()) e.mobile = 'Mobile is required';
  }
  if (step === 1) {
    if (!v.emp_code.trim()) e.emp_code = 'Employee code is required';
    if (!v.emp_job_title.trim()) e.emp_job_title = 'Job title is required';
    if (!v.department_id) e.department_id = 'Department is required';
    if (!v.emp_joining_date.trim()) e.emp_joining_date = 'Joining date is required';
  }
  return e;
}

export default function CreateEmployeeScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      employeeApi.departments().catch(() => []),
      client.get('/org-hierarchy/managers').then(unwrap).catch(() => []),
    ]).then(([depts, mgrs]) => {
      const deptArr = Array.isArray(depts) ? depts : depts?.data || [];
      const mgrArr = Array.isArray(mgrs) ? mgrs : mgrs?.data || [];
      setDepartments(deptArr.map(d => ({ value: d.department_id, label: d.department_name })));
      setManagers([{ value: '', label: 'None (Top Level)' }, ...mgrArr.map(m => ({ value: m.employee_id, label: m.full_name || `${m.first_name} ${m.last_name}` }))]);
    });
  }, []);

  const setField = useCallback((name, val) => {
    setValues(v => ({ ...v, [name]: val }));
    setErrors(e => ({ ...e, [name]: undefined }));
  }, []);

  const goNext = () => {
    const e = validateStep(step, values);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const allErrors = { ...validateStep(0, values), ...validateStep(1, values) };
    if (Object.keys(allErrors).length > 0) { setErrors(allErrors); setStep(0); return; }
    setSubmitting(true);
    try {
      await employeeApi.create({
        emp_code: values.emp_code,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        mobile: values.mobile,
        date_of_birth: values.date_of_birth || undefined,
        department_id: Number(values.department_id),
        emp_job_title: values.emp_job_title,
        reporting_to: values.reporting_to ? Number(values.reporting_to) : null,
        emp_joining_date: values.emp_joining_date,
        employee_type: values.employee_type,
        date_of_confirmation: values.date_of_confirmation || undefined,
        contract_end_date: values.contract_end_date || undefined,
      });
      Alert.alert('Success', 'Employee created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create employee');
    } finally { setSubmitting(false); }
  };

  const dept = departments.find(d => String(d.value) === String(values.department_id));

  const renderStep0 = () => (
    <View>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="First Name *" value={values.first_name} onChangeText={v => setField('first_name', v)} error={errors.first_name} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Last Name *" value={values.last_name} onChangeText={v => setField('last_name', v)} error={errors.last_name} />
        </View>
      </View>
      <Field label="Email *" value={values.email} onChangeText={v => setField('email', v)} keyboardType="email-address" error={errors.email} />
      <Field label="Mobile *" value={values.mobile} onChangeText={v => setField('mobile', v)} keyboardType="phone-pad" error={errors.mobile} />
      <DatePickerField label="Date of Birth" value={values.date_of_birth} onChange={v => setField('date_of_birth', v)} placeholder="Select date of birth" maxYear={new Date().getFullYear() - 16} />
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Employment Details</Text>
      <Field label="Employee Code *" value={values.emp_code} onChangeText={v => setField('emp_code', v)} placeholder="e.g. EMP001" error={errors.emp_code} />
      <Field label="Job Title *" value={values.emp_job_title} onChangeText={v => setField('emp_job_title', v)} error={errors.emp_job_title} />
      <SelectField label="Department *" value={values.department_id} onSelect={v => setField('department_id', v)} options={departments} error={errors.department_id} />
      <SelectField label="Reporting Manager" value={values.reporting_to} onSelect={v => setField('reporting_to', v)} options={managers} placeholder="None" />
      <SelectField label="Employee Type" value={values.employee_type} onSelect={v => setField('employee_type', v)} options={EMP_TYPES.map(t => ({ value: t, label: t }))} />
      <DatePickerField label="Joining Date *" value={values.emp_joining_date} onChange={v => setField('emp_joining_date', v)} placeholder="Select joining date" />
      {values.employee_type === 'Permanent' && (
        <DatePickerField label="Confirmation Date" value={values.date_of_confirmation} onChange={v => setField('date_of_confirmation', v)} placeholder="Select confirmation date" />
      )}
      {values.employee_type === 'Contract' && (
        <DatePickerField label="Contract End Date" value={values.contract_end_date} onChange={v => setField('contract_end_date', v)} placeholder="Select end date" />
      )}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewSection}>Personal</Text>
        {[
          ['Full Name', `${values.first_name} ${values.last_name}`],
          ['Email', values.email],
          ['Mobile', values.mobile],
          ['Date of Birth', values.date_of_birth || '—'],
        ].map(([k, v]) => (
          <View key={k} style={styles.reviewRow}>
            <Text style={styles.reviewKey}>{k}</Text>
            <Text style={styles.reviewVal}>{v}</Text>
          </View>
        ))}
        <Text style={[styles.reviewSection, { marginTop: 16 }]}>Employment</Text>
        {[
          ['Employee Code', values.emp_code],
          ['Job Title', values.emp_job_title],
          ['Department', dept?.label || '—'],
          ['Employee Type', values.employee_type],
          ['Joining Date', values.emp_joining_date],
        ].map(([k, v]) => (
          <View key={k} style={styles.reviewRow}>
            <Text style={styles.reviewKey}>{k}</Text>
            <Text style={styles.reviewVal}>{v}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.reviewNote}>
        A system-generated password will be sent to the employee's email address.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={COLORS.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Employee</Text>
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepCircle, step > i && styles.stepDone, step === i && styles.stepActive]}>
                {step > i
                  ? <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  : <Text style={[styles.stepNum, step === i && { color: COLORS.white }]}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, step === i && { color: COLORS.primary }]}>{s}</Text>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, step > i && styles.stepLineDone]} />}
            </View>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.prevBtn} onPress={goPrev}>
              <Ionicons name="arrow-back" size={16} color={COLORS.gray600} />
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.nextBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <><Ionicons name="person-add-outline" size={16} color={COLORS.white} /><Text style={styles.nextBtnText}>Create Employee</Text></>}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.gray200 },
  stepActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepNum: { fontSize: 12, fontWeight: '800', color: COLORS.gray400 },
  stepLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, marginLeft: 6 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.gray100, marginHorizontal: 6 },
  stepLineDone: { backgroundColor: COLORS.success },
  stepTitle: { fontSize: 16, fontWeight: '800', color: COLORS.secondary, marginBottom: 18 },
  reviewCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  reviewSection: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  reviewKey: { flex: 1, fontSize: 13, color: COLORS.gray500 },
  reviewVal: { fontSize: 13, fontWeight: '700', color: COLORS.secondary, maxWidth: '55%', textAlign: 'right' },
  reviewNote: { fontSize: 12, color: COLORS.gray400, marginTop: 14, textAlign: 'center', lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.gray100, gap: 12 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray200 },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray600 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10, backgroundColor: COLORS.primary },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
