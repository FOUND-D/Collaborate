const asyncHandler = require('../middleware/asyncHandler');
const supabase = require('../lib/supabase');
const {
  createListing,
  listListings,
  getListingById,
  updateListing,
} = require('../lib/repo');

const createExchangeListing = asyncHandler(async (req, res) => {
  const skillId = req.body.skillId || req.body.skill_id;
  const listingType = req.body.listingType || req.body.listing_type;

  if (!skillId) return res.status(400).json({ message: 'skillId is required' });
  if (!listingType || !['offer', 'request'].includes(listingType)) {
    return res.status(400).json({ message: 'listing_type must be offer or request' });
  }

  const listing = await createListing(req.user._id, req.body);
  res.status(201).json(listing);
});

const getExchangeListings = asyncHandler(async (req, res) => {
  const listings = await listListings({
    skill_id: req.query.skill_id,
    department: req.query.department,
    format: req.query.format,
    listing_type: req.query.listing_type,
    status: req.query.status,
  });
  res.json(listings);
});

const getExchangeListingById = asyncHandler(async (req, res) => {
  const listing = await getListingById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  res.json(listing);
});

const updateExchangeListing = asyncHandler(async (req, res) => {
  const listing = await updateListing({
    listingId: req.params.id,
    userId: req.user._id,
    payload: req.body,
  });
  if (!listing) return res.status(404).json({ message: 'Listing not found or not owned by user' });
  res.json(listing);
});

const deleteListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('exchange_listings')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user._id);

  if (error) return res.status(400).json({ message: error.message });
  res.json({ message: 'Listing removed' });
});

module.exports = {
  createExchangeListing,
  getExchangeListings,
  getExchangeListingById,
  updateExchangeListing,
  deleteListing,
};
