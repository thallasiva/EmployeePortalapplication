const svc = require('../services/workSchedule.service');
exports.listAll = async (req, res, next) => {
  try {
    const schedules = await svc.listAll(req.user.companyId);
    res.json({ success: true, data: schedules });
  } catch (err) { next(err); }
};
exports.getByEmployee = async (req, res, next) => {
  try {
    const schedule = await svc.getByEmployee(Number(req.params.employeeId), req.user.companyId);
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};
exports.getMine = async (req, res, next) => {
  try {
    const schedule = await svc.getByEmployee(Number(req.user.employeeId), req.user.companyId);
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};
exports.upsert = async (req, res, next) => {
  try {
    const adminId = req.user?.employeeId;
    const schedule = await svc.upsert(Number(req.params.employeeId), adminId, req.user.companyId, req.body);
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};
exports.remove = async (req, res, next) => {
  try {
    await svc.remove(Number(req.params.employeeId), req.user.companyId);
    res.json({ success: true, message: 'Schedule reset to company default' });
  } catch (err) { next(err); }
};
