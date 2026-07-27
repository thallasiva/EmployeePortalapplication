import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { importHolidays } from '../../../../api/holiday.api';
import { parseHolidayCsv } from '../../../../utils/holidayImport';
import { successToast, errorToast } from '../../../../utils/ToastControllers';
import { cssClass } from '../../../../utils/classStyles';

const ImportHolidayCalendarModal = React.memo(function ImportHolidayCalendarModal({
  onClose,
  onImported,
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { holidays, errors } = parseHolidayCsv(String(reader.result || ''));
        setImporting(true);
        await importHolidays(holidays);
        if (errors.length) {
          successToast(
            `Imported ${holidays.length} holiday(s). ${errors.length} row(s) were skipped.`
          );
        } else {
          successToast(`Imported ${holidays.length} holiday(s) successfully.`);
        }
        onImported();
        onClose();
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || 'Failed to import holiday calendar.';
        setError(message);
        errorToast(message);
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => { setError('Could not read the selected file.'); };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Import Holiday Calendar</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Upload a CSV file with columns <strong>Holiday Name</strong> and{' '}
            <strong>Date</strong> (YYYY-MM-DD). Optional columns:{' '}
            <strong>Shift</strong>, <strong>Location</strong>, <strong>Restricted</strong>.
          </p>

          <div
            className={cssClass({
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 10,
              padding: '10px 14px',
            })}
          >
            <div className={cssClass({ display: 'flex', alignItems: 'center', gap: 8 })}>
              <span className={cssClass({ fontSize: 18 })}>📥</span>
              <div>
                <div className={cssClass({ fontSize: 12, fontWeight: 700, color: '#92400e' })}>
                  Not sure about the format?
                </div>
                <div className={cssClass({ fontSize: 11, color: '#b45309' })}>
                  Download the template and fill it in
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const a = document.createElement('a');
                a.href = '/templates/holiday_import_template.csv';
                a.download = 'holiday_import_template.csv';
                a.click();
              }}
              className={cssClass({
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: '#f18200', color: '#fff', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
              })}
            >
              ⬇ Download Template
            </button>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center cursor-pointer hover:border-brand hover:bg-brand-50/40">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {fileName || 'Click to choose a CSV file'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={importing}
            />
          </label>

          {importing && <p className="text-sm text-brand">Importing holidays...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

export default ImportHolidayCalendarModal;
