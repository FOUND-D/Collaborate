const asyncHandler = require('../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');
const { flagRating, deleteRating } = require('../lib/repo');

const COMPLAINTS_FILE = path.join(__dirname, '../../data/complaints.json');

const ensureComplaintsFile = () => {
  if (!fs.existsSync(COMPLAINTS_FILE)) {
    const dir = path.dirname(COMPLAINTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify([]));
  }
};

const getComplaints = asyncHandler(async (req, res) => {
  ensureComplaintsFile();
  const complaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE));
  res.json(complaints);
});

const createComplaint = asyncHandler(async (req, res) => {
  ensureComplaintsFile();
  const { ratingId, reason, description } = req.body;
  const complaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE));
  
  const existing = complaints.find(c => c.ratingId === ratingId && c.reporterId === req.user._id);
  if (existing) {
    return res.status(400).json({ message: 'You have already reported this rating' });
  }

  const newComplaint = {
    _id: Date.now().toString(),
    ratingId,
    reason,
    description,
    reporterId: req.user._id,
    reporterName: req.user.name,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  complaints.push(newComplaint);
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2));

  await flagRating(ratingId);
  
  res.status(201).json(newComplaint);
});

const dismissComplaint = asyncHandler(async (req, res) => {
  ensureComplaintsFile();
  let complaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE));
  complaints = complaints.filter(c => c._id !== req.params.id);
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2));
  res.json({ message: 'Complaint dismissed' });
});

const deleteComplaint = asyncHandler(async (req, res) => {
  ensureComplaintsFile();
  const complaints = JSON.parse(fs.readFileSync(COMPLAINTS_FILE));
  const complaint = complaints.find(c => c._id === req.params.id);
  
  if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
  
  await deleteRating(complaint.ratingId);
  
  const updatedComplaints = complaints.filter(c => c._id !== req.params.id);
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(updatedComplaints, null, 2));
  
  res.json({ message: 'Rating deleted and complaint resolved' });
});

module.exports = {
  getComplaints,
  createComplaint,
  dismissComplaint,
  deleteComplaint
};
