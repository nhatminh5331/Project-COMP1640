const Campaign = require("../models/campaignModel");
const Category = require("../models/categoryModel");
const Idea = require("../models/idealModel");
const User = require("../models/userModel");
const path = require("path");
const mailer = require("../config/sendMail");
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1388148",
  key: "c0df83c5588dbc7aa9b4",
  secret: "9639ff9b7b4e016f5253",
  cluster: "ap1",
  useTLS: true,
});

const staffController = {
  //Get campaign 
  home: async (req, res) => {
    try {
      const categories = await Category.find({});
      res.render("index", {
        title: "Home page",
        categories,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getCampaign: async (req, res) => {
    try {
      const categories = await Category.find({});
      const campaigns = await Campaign.find({});
      var current = new Date();
      res.render("allCampaigns", {
        title: "List of campaigns",
        categories,
        campaigns,
        current,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getCampaignByCategory: async (req, res) => {
    try {
      const categories = await Category.find({});
      var current = new Date();
      const campaigns = await Campaign.find({ category: req.params.id });
      res.render("allCampaigns", {
        title: "List of campaigns",
        categories,
        campaigns,
        current,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getCampaignDetail: async (req, res) => {
    try {
      const categories = await Category.find({});
      const campaign = await Campaign.findOne({ _id: req.params.id });
      const ideas = await Idea.find({ campaign_id: req.params.id });
      var current = new Date();
      res.render("campaign-detail", {
        title: campaign.title,
        categories,
        campaign,
        ideas,
        current,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getCreateIdea: async (req, res) => {
    try {
      const categories = await Category.find({});
      const campaign = await Campaign.findById({
        _id: req.params.id,
      });
      if (campaign.first_closure <= new Date()) {
        req.flash(
          "danger",
          "Cannot submit new idea because the end date is over"
        );
        return res.redirect("back");
      }
      res.render("create-ideal", {
        title: "Submit an idea",
        categories,
        campaign_id: req.params.id,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },

  //Get comment and like
  createIdea: async (req, res) => {
    try {
      const { title, content, campaignId } = req.body;
      if (!title || !content) {
        req.flash("danger", "Title and content can not be empty");
        return res.redirect("create_ideal");
      }
      if (req.files.length != 0) {
        var upload_file = [];
        req.files.forEach((element) => {
          if (element.mimetype.startsWith("image/"))
            return upload_file.push({
              filename: element.filename,
              mimetype: element.mimetype,
              default_image: element.filename,
            });
          upload_file.push({
            filename: element.filename,
            mimetype: element.mimetype,
            default_image:
              "default_image_" +
              path.extname(element.originalname).substring(1) +
              ".png",
          });
        });
      }
      const newIdea = new Idea({
        user_id: req.user.id,
        title,
        content,
        campaign_id: campaignId,
        upload_file,
      });
      await newIdea.save();
      await pusher.trigger("my-channel1", "my-event1", {
        os: title,
      });

      const qacUser = await User.find({ role: "qac" });
      if (qacUser.length != 0) {
        var maillist = [];
        qacUser.forEach((element) => {
          maillist.push(element.email);
        });
        mailer.sendMail(
          maillist,
          req.user.email + " submited an idea at: " + new Date()
        );
      }

      req.flash("success", "Campaign created");
      return res.redirect("/campaign_detail/" + campaignId);
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  getIdeaDetail: async (req, res) => {
    try {
      const categories = await Category.find({});
      const idea = await Idea.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { viewBy: req.user.id }, $inc: { numberOfViews: 1 } },
        { new: true }
      );
      var user = await User.findOne({
        _id: req.user.id,
        viewIdeas: { $elemMatch: { idea_id: req.params.id } },
      });
      if (!user) {
        var user = await User.findOneAndUpdate(
          {
            _id: req.user.id,
          },
          {
            $push: {
              viewIdeas: [
                { idea_id: req.params.id, isLike: false, isDislike: false },
              ],
            },
          },
          { new: true }
        );
      }

      var likeState;
      user.viewIdeas.forEach((element) => {
        if (element.idea_id == req.params.id) return (likeState = element);
      });
      await pusher.trigger("my-channel", "my-event", {
        points: 1,
        os: idea.title,
      });
      res.render("idea-detail", {
        title: "idea detail",
        categories,
        idea,
        likeState,
      });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  comment: async (req, res) => {
    try {
      const { comment } = req.body;
      const idea = await Idea.findOne({ _id: req.params.id });

      const campaign = await Campaign.findOne({ _id: idea.campaign_id });
      if (campaign.final_closure <= new Date()) {
        req.flash("danger", "Cannot comment because the end date is over");
        return res.redirect("back");
      }
      const user = await User.findOne({ _id: idea.user_id });
      mailer.sendMail(
        user.email,
        req.user.email + " commented on your idea at: " + new Date()
      );

      await Idea.updateOne(
        { _id: req.params.id },
        {
          $push: {
            comments: [{ user: req.params.id, content: comment }],
          },
          $inc: { numberOfComments: 1 },
        }
      );
      await Idea.updateOne(
        { _id: req.params.id },
        { $pop: { viewBy: 1 }, $inc: { numberOfViews: -1 } }
      );
      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  like: async (req, res) => {
    try {
      await User.findOneAndUpdate(
        { _id: req.user.id, "viewIdeas.idea_id": req.params.id },
        { $set: { "viewIdeas.$.isLike": true, "viewIdeas.$.isDislike": false } }
      );
      const state = req.query.state;
      if (state == "true") {
        await Idea.updateOne(
          { _id: req.params.id },
          {
            $pull: { dislikeBy: req.user.id },
            $inc: { numberOfDislikes: -1 },
          }
        );
      }
      await Idea.updateOne(
        { _id: req.params.id },
        {
          $push: { likeBy: req.user.id },
          $inc: { numberOfLikes: 1 },
        }
      );
      await Idea.updateOne(
        { _id: req.params.id },
        {
          $pop: { viewBy: 1 },
          $inc: { numberOfViews: -1 },
        }
      );
      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  unlike: async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.user.id, "viewIdeas.idea_id": req.params.id },
        { $set: { "viewIdeas.$.isLike": false } }
      );
      await Idea.updateOne(
        { _id: req.params.id },
        {
          $pop: { viewBy: 1 },
          $inc: { numberOfViews: -1 },
          $pull: { likeBy: req.user.id },
          $inc: { numberOfLikes: -1 },
        }
      );
      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  dislike: async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.user.id, "viewIdeas.idea_id": req.params.id },
        { "viewIdeas.$.isLike": false, "viewIdeas.$.isDislike": true }
      );
      const state = req.query.state;
      if (state == "true") {
        await Idea.updateOne(
          { _id: req.params.id },
          {
            $pull: { likeBy: req.user.id },
            $inc: { numberOfLikes: -1 },
          }
        );
      }

      await Idea.updateOne(
        { _id: req.params.id },
        {
          $push: { dislikeBy: req.user.id },
          $inc: { numberOfDislikes: 1 },
        }
      );
      await Idea.updateOne(
        { _id: req.params.id },
        {
          $pop: { viewBy: 1 },
          $inc: { numberOfViews: -1 },
        }
      );
      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  unDislike: async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.user.id, "viewIdeas.idea_id": req.params.id },
        { $set: { "viewIdeas.$.isDislike": false } }
      );
      await Idea.updateOne(
        { _id: req.params.id },
        {
          $pop: { viewBy: 1 },
          $inc: { numberOfViews: -1 },
          $pull: { dislikeBy: req.user.id },
          $inc: { numberOfDislikes: -1 },
        }
      );
      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
};

module.exports = staffController;
