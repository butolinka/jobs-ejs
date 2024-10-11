const Job = require('../models/Job');

const getAllJobs = async(req, res) =>{
    const jobs = await Job.find({createdBy:req.user._id});
    res.render('jobs',{jobs});
};

const newJobForm = (req, res)=>{
    res.render('job', {job:null});
};

const createJob = async (req, res)=>{
    try{
        const newJobForm = new Job({
            ...req.body,
            createdBy: req.user._id
        });
        await newJobForm.save();
        req.flash('info','Job created successfuly');
        res.redirect('/jobs');
    } catch(error){
        req.flash('error','Error creating job');
        res.redirect('/jobs');
    }
};

const editJob = async (req,res) =>{
    const job = await Job.findById(req.params.id);
    if(job.createdBy.toString()!==req.user._id.toString()){
        req.flash('error', 'Unauthorized');
        return res.redirect('/jobs');
    }
    res.render('job', {job});
};

const updateJob = async (req,res)=>{
    try{
        const job = await Job.findById(req.params.id);
        if(job.createdBy.toString()!==req.user._id.toString()){
            req.flash('error','Unauthorized');
            return res.redirect('/jobs');
        }
        Object.assign(job, req.body);
        await job.save();
        req.flash('info', 'Job updated successfully');
        req.redirect('/jobs');
    } catch(error){
        req.flash('error','Error updating job');
        return res.redirect('/jobs');
    }
};

const deleteJob = async (req, res) =>{
    try{
        const job = await Job.findById(req.params.id);
        if (!job) {
            req.flash('error', 'Job not found');
            return res.redirect('/jobs');
        }
        if(job.createdBy.toString()!==req.user._id.toString()){
            req.flash('error','Unauthorized');
            return res.redirect('/jobs');
        }
        await job.deleteOne();
        req.flash('info', 'Job deleted successfully');
        return res.redirect('/jobs');
    } catch(error){
        console.error("Error while deleting job:", error);
        req.flash('error','Error deleting job');
        return res.redirect('/jobs');
    }
};

module.exports = {
    getAllJobs,
    newJobForm,
    createJob,
    updateJob,
    deleteJob,
    editJob
};