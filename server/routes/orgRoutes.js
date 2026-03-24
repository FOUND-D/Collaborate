const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { requireOrgMember, requireOrgPermission } = require('../middleware/orgMiddleware');
const {
  listMembers,
  provisionMember,
  updateMemberRole,
  updateMemberStatus,
  removeMember,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getCompliance,
  updateCompliance,
  getComplianceMe,
  listCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getAuditLog,
} = require('../controllers/orgController');

const router = express.Router();

router.use(protect, requireOrgMember);

router.route('/:orgId/members/provision').post(requireOrgPermission('can_invite_members'), provisionMember);
router.route('/:orgId/members').get(requireOrgPermission('can_manage_members'), listMembers);
router.route('/:orgId/members/:userId/role').patch(requireOrgPermission('can_manage_members'), updateMemberRole);
router.route('/:orgId/members/:userId/status').patch(requireOrgPermission('can_manage_members'), updateMemberStatus);
router.route('/:orgId/members/:userId').delete(requireOrgPermission('can_manage_members'), removeMember);

router.route('/:orgId/roles').get(listRoles).post(requireOrgPermission('can_manage_roles'), createRole);
router.route('/:orgId/roles/:roleId').patch(requireOrgPermission('can_manage_roles'), updateRole).delete(requireOrgPermission('can_manage_roles'), deleteRole);

router.route('/:orgId/compliance').get(getCompliance).patch(requireOrgPermission('can_manage_settings'), updateCompliance);
router.route('/:orgId/compliance/me').get(getComplianceMe);

router.route('/:orgId/custom-fields').get(listCustomFields).post(requireOrgPermission('can_manage_settings'), createCustomField);
router.route('/:orgId/custom-fields/:fieldId').patch(requireOrgPermission('can_manage_settings'), updateCustomField).delete(requireOrgPermission('can_manage_settings'), deleteCustomField);

router.route('/:orgId/audit-log').get(requireOrgPermission('can_view_reports'), getAuditLog);

module.exports = router;
