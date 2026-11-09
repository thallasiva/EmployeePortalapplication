import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Users } from "lucide-react";
import Button from "../../components/ui/Button";
import { listEmployees } from "../../api/employee.api";
import { assignTraining, listTrainingAssignments, listTrainingCourses, saveTrainingCourse } from "../../api/workforce.api";
import { getErrorMessage } from "../../api/client";

const initialCourse = { title: "", category: "", description: "", duration_hours: "" };
export default function TrainingManagement() {
  const [courses, setCourses] = useState([]);
  const [trainingAssignments, setTrainingAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialCourse);
  const [assignments, setAssignments] = useState({});
  const [dueDates, setDueDates] = useState({});
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [courseRows, assignmentRows, employeeResult] = await Promise.all([
        listTrainingCourses(),
        listTrainingAssignments(),
        listEmployees({ limit: 1000, status: "Active" }),
      ]);
      setCourses(courseRows || []);
      setTrainingAssignments(assignmentRows || []);
      setEmployees(employeeResult?.data || []);
    } catch (error) {
      setNotice(getErrorMessage(error, "Unable to load training data."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const saveCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      await saveTrainingCourse({
        ...form,
        duration_hours: form.duration_hours === "" ? null : Number(form.duration_hours),
      }, editingCourseId);
      setForm(initialCourse);
      setEditingCourseId(null);
      setNotice(editingCourseId ? "Training course updated." : "Training course created.");
      await load();
    } catch (error) {
      setNotice(getErrorMessage(error, "Unable to save course."));
    } finally {
      setSaving(false);
    }
  };
  const assign = async (courseId) => {
    const employeeIds = assignments[courseId] || [];
    if (!employeeIds.length) {
      setNotice("Choose at least one employee to assign this course.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      await assignTraining(courseId, { employee_ids: employeeIds.map(Number), due_date: dueDates[courseId] || null });
      setAssignments((current) => ({ ...current, [courseId]: [] }));
      setNotice("Training assigned successfully.");
      await load();
    } catch (error) {
      setNotice(getErrorMessage(error, "Unable to assign training."));
    } finally {
      setSaving(false);
    }
  };
  const editCourse = (course) => {
    setEditingCourseId(course.course_id);
    setForm({
      title: course.title || "",
      category: course.category || "",
      description: course.description || "",
      duration_hours: course.duration_hours ?? "",
    });
  };
  const toggleCourse = async (course) => {
    setSaving(true);
    setNotice("");
    try {
      await saveTrainingCourse({
        title: course.title,
        category: course.category,
        description: course.description,
        duration_hours: course.duration_hours,
        is_active: !Boolean(course.is_active),
      }, course.course_id);
      setNotice(course.is_active ? "Course deactivated." : "Course activated.");
      await load();
    } catch (error) {
      setNotice(getErrorMessage(error, "Unable to update course."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-amber-700">PEOPLE MANAGEMENT</p>
        <h1 className="mt-1 text-2xl font-bold  text-[#f18200]">Training &amp; Development</h1>
        <p className="mt-1 text-sm text-slate-500">Create company training courses, assign employees, and track completion.</p>
      </header>
      {notice && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">{notice}</div>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Plus size={18} /> {editingCourseId ? "Edit course" : "Add a course"}</h2>
        <form onSubmit={saveCourse} className="grid gap-3 md:grid-cols-2">
          <input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Course title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input maxLength={80} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category (e.g. Compliance)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" min="0" step="0.5" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} placeholder="Duration in hours" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2 md:col-span-2"><Button type="submit" loading={saving}>{editingCourseId ? "Save changes" : "Create course"}</Button>{editingCourseId && <Button type="button" variant="secondary" disabled={saving} onClick={() => { setEditingCourseId(null); setForm(initialCourse); }}>Cancel</Button>}</div>
        </form>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div><h2 className="font-semibold text-slate-800">Course catalog</h2><p className="mt-1 text-sm text-slate-500">{courses.length} courses</p></div>
          <BookOpen className="text-amber-600" size={20} />
        </div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading courses…</p> : courses.length === 0 ? <p className="p-6 text-sm text-slate-500">No courses have been created yet.</p> : (
          <div className="divide-y divide-slate-100">
            {courses.map((course) => (
              <article key={course.course_id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-semibold text-slate-800">{course.title}</h3><p className="mt-1 text-sm text-slate-500">{course.category || "General"}{course.duration_hours ? ` · ${course.duration_hours} hours` : ""} · {course.is_active ? "Active" : "Inactive"}</p>{course.description && <p className="mt-2 text-sm text-slate-600">{course.description}</p>}</div>
                  <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{Number(course.completed_count || 0)} / {Number(course.assigned_count || 0)} completed</span><Button size="sm" variant="secondary" disabled={saving} onClick={() => editCourse(course)}>Edit</Button><Button size="sm" variant="secondary" disabled={saving} onClick={() => toggleCourse(course)}>{course.is_active ? "Deactivate" : "Activate"}</Button></div>
                </div>
                {Boolean(course.is_active) && (
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                    <select multiple aria-label={`Employees for ${course.title}`} value={assignments[course.course_id] || []} onChange={(e) => setAssignments({ ...assignments, [course.course_id]: Array.from(e.target.selectedOptions, (option) => option.value) })} className="min-h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                      {employees.map((employee) => <option key={employee.employee_id} value={employee.employee_id}>{employee.first_name} {employee.last_name || ""} · {employee.emp_code}</option>)}
                    </select>
                    <input type="date" aria-label="Training due date" value={dueDates[course.course_id] || ""} onChange={(e) => setDueDates({ ...dueDates, [course.course_id]: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <Button type="button" disabled={saving} onClick={() => assign(course.course_id)} icon={<Users size={15} />}>Assign</Button>
                  </div>
                )}
                {trainingAssignments.some((row) => Number(row.course_id) === Number(course.course_id)) && (
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full min-w-[460px] text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Assigned employee</th><th className="px-3 py-2">Due date</th><th className="px-3 py-2">Status</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{trainingAssignments.filter((row) => Number(row.course_id) === Number(course.course_id)).map((row) => <tr key={row.assignment_id}><td className="px-3 py-2 text-slate-700">{row.employee_name} · {row.emp_code}</td><td className="px-3 py-2 text-slate-500">{row.due_date || "—"}</td><td className="px-3 py-2 text-slate-600">{row.status}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
