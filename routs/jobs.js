const express = require("express");
const router = express.Router();
const jobController = require('../controllers/jobs');

router.get('/', jobController.getAllJobs);
router.get('/new', jobController.newJobForm);
router.post('/', jobController.createJob);
router.get('/edit/:id', jobController.editJob);
router.post('/update/:id', jobController.updateJob);
router.post('/delete/:id', jobController.deleteJob);

module.exports=router;
