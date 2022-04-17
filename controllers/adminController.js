const User = require("../models/userModel");
const Campaign = require("../models/campaignModel");
const Department = require("../models/departmentModel");
// const Idea = require("../models/idealModel");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const backup = require("../config/backup");

const adminController = {
    //Account
  createAccount: async (req, res) => {
    try {
      const { email, password, role, confirmedPassword, department } = req.body;
      const user = await User.findOne({ email });
      const emailRegexp =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (user) {
        req.flash("danger", "This email is already existed");
        return res.redirect("back");
      }
      if (!emailRegexp.test(email)) {
        req.flash("danger", "Email is  invalid");
        return res.redirect("back");
      }
      if (password.length < 6) {
        req.flash("danger", "Password is at least 6 characters long");
        return res.redirect("back");
      }

      if (password != confirmedPassword) {
        req.flash("danger", "Confirm Password is not match");
        return res.redirect("back");
      }

      //password encryption
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        role,
        password: passwordHash,
        department,
      });

      await newUser.save();
      req.flash("success", "Account Created");
      res.redirect("/adminPage/accounts");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getCreateAccount: async (req, res) => {
    try {
      const departments = await Department.find({});
      res.render("adminPage/createAccount", {
        title: "Create Account",
        departments,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  viewAllAccounts: async (req, res) => {
    try {
      const user = await User.find({});
      res.render("adminPage/viewAllAccounts", { user });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getAccountById: async (req, res) => {
    try {
      const departments = await Department.find({});
      const user = await User.findById(req.params.id);
      if (!user) {
        req.flash("danger", "This account is not exist");
        return res.redirect("back");
      }
      res.render("adminPage/updateAccount", { user, departments });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  updateAccount: async (req, res) => {
    try {
      const { email, role, department } = req.body;
      const user = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (user) {
        req.flash("danger", "Email is already existed");
        res.redirect("/adminPage/edit_account/" + req.params.id);
      }

      await User.findOneAndUpdate(
        { _id: req.params.id },
        { email, role, department }
      );

      req.flash("success", "Account updated success");
      res.redirect("/adminPage/accounts");
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  deleteAccount: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        req.flash("danger", "Account invalid");
        res.redirect("/adminPage/accounts");
      }

      await user.delete();
      req.flash("success", "Account deleted success");
      res.redirect("/adminPage/accounts");
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  //Department
  viewAllDepartments: async (req, res) => {
    try {
      const departments = await Department.find({});
      res.render("adminPage/createDepartment", {departments});
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  createDepartment: async (req, res) => {
    try {
      const { name } = req.body;
      const department = await Department.findOne({ department_name: name });
      if (department) {
        req.flash("danger", "This department is exist");
        return res.redirect("back");
      }
      const newDepartment = new Department({
        department_name: name,
      });
      await newDepartment.save();
      res.redirect("/adminPage/createDepartment");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },

  //Campaign
  //Feature of QA manager, only QA manager can CRUD campaign
  viewAllCampaigns: async (req, res) => {
    try {
      const current = new Date();
      const campaigns = await Campaign.find({});
      res.render("adminPage/viewCampaigns", {campaigns, current});
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getCreateCampaign: async (req, res) => {
    try {
      const categories = await Category.find({});
      res.render("adminPage/createCampaign", {categories});
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  createCampaign: async (req, res) => {
    try {
      const { title, category, content, first_closure, final_closure } =
        req.body;

      if (final_closure <= first_closure) {
        req.flash(
          "danger",
          "End date must be set after start date"
        );
        return res.redirect("/adminPage/createCampaign");
      }

      const newCampaign = new Campaign({
        title,
        category,
        name: content,
        first_closure,
        final_closure,
      });
      await Category.updateOne(
        { _id: category },
        { $push: { campaign: { campaign_id: newCampaign._id } } }
      );
      await newCampaign.save();
      req.flash("success", "Campaign created");
      return res.redirect("/adminPage/campaigns");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  updateCampaign: async (req, res) => {
    try {
      const { title, category, content, first_closure, final_closure } =
        req.body;
      if (final_closure <= first_closure) {
        req.flash(
          "danger",
          "Final closure date must be set after first closure date"
        );
        return res.redirect("/adminPage/campaign/" + req.params.id);
      }
      const campaign = await Campaign.findById(req.params.id);
      if (category != campaign.category) {
        await Category.updateOne(
          { _id: category },
          { $push: { campaign: { campaign_id: req.params.id } } }
        );
        await Category.updateOne(
          { _id: campaign.category },
          { $pull: { campaign: { campaign_id: req.params.id } } }
        );
      }

      await Campaign.findOneAndUpdate(
        { _id: req.params.id },
        { title, category, name: content, first_closure, final_closure }
      );
      req.flash("success", "Campaigns updated");
      res.redirect("/adminPage/campaigns");
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  getCampaignById: async (req, res) => {
    try {
      const categories = await Category.find({});
      const campaign = await Campaign.findById(req.params.id);
      date1st = campaign.first_closure.toISOString().slice(0, -5);
      date2rd = campaign.final_closure.toISOString().slice(0, -5);
      if (!campaign) {
        req.flash("danger", "This topic is not exist");
        return res.redirect("adminPage/campaigns");
      }
      return res.render("adminPage/updateCampaign", {
        campaign,
        categories,
        date1st,
        date2rd,
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  deleteCampaign: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        req.flash("danger", "Campaign invalid");
        res.redirect("/adminPage/campaigns");
      }
      await Category.updateOne(
        { _id: campaign.category },
        { $pull: { campaign: { campaign_id: req.params.id } } },
      );
      await campaign.delete(),
      req.flash("success", "Campaign deleted successfully");
      res.redirect("/adminPage/campaigns");
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  //Backup data
  getMaintain: async (req, res) => {
    res.render("adminPage/maintain");
  },
  getBackup: async (req, res) => {
    backup();
    res.render("adminPage/maintain");
  },
};

module.exports = adminController;
