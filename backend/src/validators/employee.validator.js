const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  emp_code: Joi.string().max(30).allow('', null),
  first_name: Joi.string().max(80).required(),
  last_name: Joi.string().max(80).allow('', null),
  email: Joi.string().email().required(),
  mobile: Joi.string().max(20).allow('', null),
  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null),
  dob: Joi.date().allow(null),
  marital_status: Joi.string().max(20).allow('', null),
  blood_group: Joi.string().max(10).allow('', null),
  reporting_to: Joi.number().integer().allow(null),
  emp_job_title: Joi.string().max(100).allow('', null),
  department_id: Joi.number().integer().allow(null),
  designation_id: Joi.number().integer().allow(null),
  leadership_role_id: Joi.number().integer().allow(null),
  office_id: Joi.number().integer().allow(null),
  team_id: Joi.number().integer().allow(null),
  employee_type: Joi.string().max(30).allow('', null),
  employee_status: Joi.string().max(20).allow('', null),
  shift: Joi.string().max(20).allow('', null),
  location: Joi.string().max(100).allow('', null),
  holiday_calendar: Joi.string().max(100).allow('', null),
  emp_joining_date: Joi.date().allow('', null),
  emp_exit_date: Joi.date().allow('', null),
  ctc: Joi.number().allow(null),
  base_salary: Joi.number().allow(null),
  benefits_plan: Joi.string().max(40).allow('', null),
  assigned_member: Joi.string().max(100).allow('', null),
  role_id: Joi.number().integer().valid(1, 2, 3),
  password: Joi.string().min(6).max(100).allow('', null),


  father_name: Joi.string().max(100).allow('', null),
  spouse_name: Joi.string().max(100).allow('', null),
  aadhaar_number: Joi.string().max(20).allow('', null),
  aadhaar_name: Joi.string().max(100).allow('', null),
  aadhaar_enrolment_number: Joi.string().max(40).allow('', null),
  access_card_number: Joi.string().max(40).allow('', null),
  access_card_from_date: Joi.date().allow('', null),
  access_card_to_date: Joi.date().allow('', null),
  pf_number: Joi.string().max(40).allow('', null),
  pf_join_date: Joi.date().allow('', null),
  esi_number: Joi.string().max(40).allow('', null),
  has_left_organization: Joi.boolean().truthy(1, '1').falsy(0, '0').allow(null),


  contactInfo: Joi.object({
    current_address: Joi.string().max(255).allow('', null),
    permanent_address: Joi.string().max(255).allow('', null),
    personal_email: Joi.string().email().allow('', null),
    alternate_mobile: Joi.string().max(20).allow('', null),
    emergency_contact_name: Joi.string().max(100).allow('', null),
    emergency_contact_relation: Joi.string().max(50).allow('', null),
    emergency_contact_phone: Joi.string().max(20).allow('', null),
    contact_name: Joi.string().max(100).allow('', null),
    contact_city: Joi.string().max(100).allow('', null),
    contact_country: Joi.string().max(100).allow('', null),
    permanent_address_line1: Joi.string().max(255).allow('', null),
    permanent_address_line2: Joi.string().max(255).allow('', null),
    permanent_address_line3: Joi.string().max(255).allow('', null)
  }).optional(),
  bankDetails: Joi.object({
    bank_name: Joi.string().max(100).allow('', null),
    account_number: Joi.string().max(40).allow('', null),
    ifsc_code: Joi.string().max(20).allow('', null),
    pan_number: Joi.string().max(20).allow('', null),
    uan_number: Joi.string().max(20).allow('', null),
    account_type: Joi.string().max(30).allow('', null),
    bank_branch: Joi.string().max(100).allow('', null),
    dd_payable_at: Joi.string().max(100).allow('', null),
    account_holder_name: Joi.string().max(100).allow('', null),
    payment_type: Joi.string().max(30).allow('', null)
  }).optional()
});

const updateEmployeeSchema = createEmployeeSchema.fork(
  ['first_name', 'email'],
  (schema) => schema.optional()
);

const contactInfoSchema = Joi.object({
  current_address: Joi.string().max(255).allow('', null),
  permanent_address: Joi.string().max(255).allow('', null),
  personal_email: Joi.string().email().allow('', null),
  alternate_mobile: Joi.string().max(20).allow('', null),
  emergency_contact_name: Joi.string().max(100).allow('', null),
  emergency_contact_relation: Joi.string().max(50).allow('', null),
  emergency_contact_phone: Joi.string().max(20).allow('', null),
  contact_name: Joi.string().max(100).allow('', null),
  contact_city: Joi.string().max(100).allow('', null),
  contact_country: Joi.string().max(100).allow('', null),
  permanent_address_line1: Joi.string().max(255).allow('', null),
  permanent_address_line2: Joi.string().max(255).allow('', null),
  permanent_address_line3: Joi.string().max(255).allow('', null)
});

const bankDetailsSchema = Joi.object({
  bank_name: Joi.string().max(100).allow('', null),
  account_number: Joi.string().max(40).allow('', null),
  ifsc_code: Joi.string().max(20).allow('', null),
  pan_number: Joi.string().max(20).allow('', null),
  uan_number: Joi.string().max(20).allow('', null),
  account_type: Joi.string().max(30).allow('', null),
  bank_branch: Joi.string().max(100).allow('', null),
  dd_payable_at: Joi.string().max(100).allow('', null),
  account_holder_name: Joi.string().max(100).allow('', null),
  payment_type: Joi.string().max(30).allow('', null)
});

const directoryQuerySchema = Joi.object({
  location: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  holidayCalendar: Joi.string().allow('', null)
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  contactInfoSchema,
  bankDetailsSchema,
  directoryQuerySchema
};
