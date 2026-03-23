const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createOrganisation,
  getMyOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  inviteMemberToOrg,
  acceptOrgInvite,
  removeMemberFromOrg,
  updateMemberRole,
  getOrgMembers,
  getOrgTeams,
} = require('../controllers/organisationController');

const router = express.Router();

router.route('/').post(createOrganisation).get(protect, getMyOrganisations);
router.get('/invite/accept', acceptOrgInvite);
router.route('/:id').get(protect, getOrganisationById).put(protect, updateOrganisation).delete(protect, deleteOrganisation);
router.route('/:id/members').get(protect, getOrgMembers);
router.route('/:id/members/invite').post(protect, inviteMemberToOrg);
router.route('/:id/members/:userId/role').put(protect, updateMemberRole);
router.route('/:id/members/:userId').delete(protect, removeMemberFromOrg);
router.route('/:id/teams').get(protect, getOrgTeams);

module.exports = router;
