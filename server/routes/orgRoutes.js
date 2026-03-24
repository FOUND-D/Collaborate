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
  getRoleMemberCounts,
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

router.route('/:orgId/members/provision').post(requireOrgPermission('canInviteMembers'), provisionMember);
router.route('/:orgId/members').get(requireOrgPermission('canManageMembers'), listMembers);
router.route('/:orgId/members/:userId/role').patch(requireOrgPermission('canManageMembers'), updateMemberRole);
router.route('/:orgId/members/:userId/status').patch(requireOrgPermission('canManageMembers'), updateMemberStatus);
router.route('/:orgId/members/:userId').delete(requireOrgPermission('canManageMembers'), removeMember);

router.route('/:orgId/roles').get(listRoles).post(requireOrgPermission('canManageRoles'), createRole);
router.route('/:orgId/roles/counts').get(getRoleMemberCounts);
router.route('/:orgId/roles/:roleId').patch(requireOrgPermission('canManageRoles'), updateRole).delete(requireOrgPermission('canManageRoles'), deleteRole);

router.route('/:orgId/compliance').get(getCompliance).patch(requireOrgPermission('canManageSettings'), updateCompliance);
router.route('/:orgId/compliance/me').get(getComplianceMe);

router.route('/:orgId/custom-fields').get(listCustomFields).post(requireOrgPermission('canManageSettings'), createCustomField);
router.route('/:orgId/custom-fields/:fieldId').patch(requireOrgPermission('canManageSettings'), updateCustomField).delete(requireOrgPermission('canManageSettings'), deleteCustomField);

router.route('/:orgId/audit-log').get(requireOrgPermission('canViewReports'), getAuditLog);

module.exports = router;
