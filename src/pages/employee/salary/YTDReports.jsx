import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { FiscalYearPicker } from '../../../component/YearPicker';
import {
  getCurrentFiscalYearStart,
  getFiscalMonthColumns,
  getFiscalYearRangeLabel,
} from '../../../lib/dateUtils';

const MONTH_KEYS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

const emptyMonths = () =>
  MONTH_KEYS.reduce((acc, key) => {
    acc[key] = '0.00';
    return acc;
  }, {});

const buildRow = (item, total, aprValue, isBold = false) => ({
  item,
  total,
  ...emptyMonths(),
  apr: aprValue,
  isBold,
});

const YTDReports = () => {
  const [activeTab, setActiveTab] = useState('ytd');
  const [fiscalYearStart, setFiscalYearStart] = useState(
    String(getCurrentFiscalYearStart())
  );
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    deduction: true,
    days: true,
    blanks: true,
  });

  const fiscalMonths = getFiscalMonthColumns(fiscalYearStart);
  const fiscalRangeLabel = getFiscalYearRangeLabel(fiscalYearStart);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const incomeData = [
    buildRow('Basic', '74,250.00', '74,250.00'),
    buildRow('HRA', '37,125.00', '37,125.00'),
    buildRow('Special Allowance', '30,492.00', '30,492.00'),
    buildRow('Lta', '3,333.00', '3,333.00'),
    buildRow('Telephone And Inter...', '1,500.00', '1,500.00'),
    buildRow('Gross', '1,46,700.00', '1,46,700.00', true),
  ];

  const deductionData = [
    buildRow('PF', '1,800.00', '1,800.00'),
    buildRow('Prof Tax', '200.00', '200.00'),
    buildRow('Income Tax', '11,880.00', '11,880.00'),
    buildRow('Total Deductions', '13,880.00', '13,880.00', true),
  ];

  const daysData = [
    buildRow('Emp Effective Workd...', '30.00', '30.00'),
    buildRow('Days In Month', '30.00', '30.00'),
  ];

  const netPayData = [
    {
      item: 'Net Pay',
      total: '1,32,820.00',
      apr: '1,32,820.00',
      ...emptyMonths(),
      isBold: true,
      isHighlight: true,
    },
  ];

  const TableRow = ({ data, isTotal = false }) => (
    <tr
      className={
        isTotal
          ? 'bg-brand-50 font-semibold border-b'
          : 'border-b hover:bg-gray-50'
      }
    >
      <td
        className={`px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white ${
          isTotal ? 'bg-brand-50' : ''
        }`}
      >
        {data.item}
      </td>
      <td
        className={`px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-gray-800 sticky left-24 bg-white ${
          isTotal ? 'bg-brand-50' : ''
        }`}
      >
        {data.total}
      </td>
      {MONTH_KEYS.map((month) => (
        <td
          key={month}
          className={`px-4 py-3 text-sm text-right whitespace-nowrap ${
            isTotal ? 'bg-brand-50 font-semibold' : ''
          } text-gray-600`}
        >
          {data[month]}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">YTD Reports</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ytd')}
              className={`px-4 py-2 text-sm font-medium rounded ${
                activeTab === 'ytd'
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              YTD Statement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pfytd')}
              className={`px-4 py-2 text-sm font-medium rounded ${
                activeTab === 'pfytd'
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              PF YTD Statement
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="bg-brand hover:bg-brand-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <FiscalYearPicker
              value={fiscalYearStart}
              onChange={setFiscalYearStart}
            />
            <span className="text-sm text-gray-600">{fiscalRangeLabel}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                  Item
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 sticky left-24 bg-gray-100 z-10">
                  Total in ₹
                </th>
                {fiscalMonths.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleSection('income')}
              >
                <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-0 bg-white flex items-center gap-2">
                  {expandedSections.income ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Income
                </td>
                <td colSpan={MONTH_KEYS.length + 1} />
              </tr>
              {expandedSections.income &&
                incomeData.map((row, idx) => (
                  <TableRow key={idx} data={row} isTotal={row.isBold} />
                ))}

              <tr
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleSection('deduction')}
              >
                <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-0 bg-white flex items-center gap-2">
                  {expandedSections.deduction ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Deduction
                </td>
                <td colSpan={MONTH_KEYS.length + 1} />
              </tr>
              {expandedSections.deduction &&
                deductionData.map((row, idx) => (
                  <TableRow key={idx} data={row} isTotal={row.isBold} />
                ))}

              <tr
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleSection('days')}
              >
                <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-0 bg-white flex items-center gap-2">
                  {expandedSections.days ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Days
                </td>
                <td colSpan={MONTH_KEYS.length + 1} />
              </tr>
              {expandedSections.days &&
                daysData.map((row, idx) => (
                  <TableRow key={idx} data={row} />
                ))}

              <tr className="border-b bg-yellow-50">
                <td
                  colSpan={MONTH_KEYS.length + 2}
                  className="px-4 py-3 text-sm font-bold text-gray-800"
                >
                  Net Pay
                </td>
              </tr>
              {netPayData.map((row, idx) => (
                <tr key={idx} className="bg-yellow-50 border-b">
                  <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-0 bg-yellow-50">
                    {row.item}
                  </td>
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-bold text-gray-800 sticky left-24 bg-yellow-50">
                    {row.total}
                  </td>
                  {MONTH_KEYS.map((month) => (
                    <td
                      key={month}
                      className="px-4 py-3 text-sm text-right whitespace-nowrap font-semibold text-gray-700 bg-yellow-50"
                    >
                      {row[month]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YTDReports;
