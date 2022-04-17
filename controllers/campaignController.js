const Campaign = require("../models/campaignModel");

const campaignController = {
  getCampaign: async (req, res) => {
    try {
      const campaigns = await Campaign.find();
      res.render("allCampaigns", { campaigns, title: "List of Campaign" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

module.exports = campaignController;
