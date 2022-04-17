const Category = require("../models/categoryModel");
const Ideas = require("../models/idealModel");
const Campaign = require("../models/campaignModel");
const fileSystem = require("fs");
const fastcsv = require("fast-csv");
const admzip = require("adm-zip");
const path = require("path");

const qamController = {
  //Category
  viewAllCategories: async (req, res) => {
    try {
      const categories = await Category.find({});
      if (!categories)
        return res.status(400).send({ msg: "User does not exist" });
      res.render("qamPage/viewCategories", { categories });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.findOne({ category: name });
      if (category)
        return res.status(400).send({ msg: "this category is already exists" });
      const newCategory = new Category({ category: name });
      await newCategory.save();
      return res.redirect("/qamPage/");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        req.flash("danger", "Category invalid");
        return res.redirect("/qamPage/");
      }
      if (category.campaign.length != 0) {
        req.flash("danger", "Cannot delete category");
        return res.redirect("/qamPage/");
      }
        await category.delete();
      req.flash("success", "Category deleted !");
      res.redirect("/qamPage/");
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  updateCategory: async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.findOne({
        category: name,
        _id: { $ne: req.params.id },
      });
      if (category) {
        req.flash("danger", "Category is already existed");
        return res.redirect("/qamPage/");
      }

      await Category.findOneAndUpdate(
        { _id: req.params.id },
        { category: name }
      );

      req.flash("success", "Account updated");
      res.redirect("/qamPage/");
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  //Download file upload
  getDownload: async (req, res) => {
    try {
      const campaigns = await Campaign.find();
      res.render("qamPage/downIdeaFile", { campaigns });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  downloadCSV: async (req, res) => {
    try {
      const ideas = await Ideas.aggregate([
        {
          $project: {
            _id: 1,
            campaign_id: 1,
            user_id: 1,
            title: 1,
            content: 1,
            numberOfViews: 1,
            numberOfLikes: 1,
            numberOfDislikes: 1,
            numberOfComments: 1,
            createdAt: 1,
          },
        },
      ]);
      var ws = fileSystem.createWriteStream("public/files/idea.csv");
      fastcsv.write(ideas, { headers: true }).pipe(ws);

      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
  downloadZip: async (req, res) => {
    try {
      const zip = new admzip();

      const isDir = fileSystem.existsSync(
        path.resolve(__dirname + "/../public/uploads/" + req.params.id)
      );

      if (isDir) {
        var uploadDir = fileSystem.readdirSync(
          path.resolve(__dirname + "/../public/uploads/" + req.params.id)
        );
        for (var i = 0; i < uploadDir.length; i++) {
          zip.addLocalFile(
            path.resolve(
              __dirname +
                "/../public/uploads/" +
                req.params.id +
                "/" +
                uploadDir[i]
            )
          );
        }
        const file_after_download = req.params.id + ".zip";
        const data = zip.toBuffer();

        res.set("Content-Type", "application/octet-stream");
        res.set(
          "Content-Disposition",
          `attachment; filename=${file_after_download}`
        );
        res.set("Content-Length", data.length);
        return res.send(data);
      }
      req.flash("danger", "Topic has no uploaded file");
      res.redirect("back");
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },

  //Get data dashboard in view
  getDashboard: async (req, res) => {
    try {
      const ideas = await Ideas.find();
      res.render("qamPage/dashBoardData", { ideas });
    } catch (error) {
      return res.status(500).send({ msg: error.message });
    }
  },
};

module.exports = qamController;
