const router = require("express").Router();
const qamController = require("../controllers/qamController");

router.route("/").get(qamController.viewAllCategories);
router.route("/create_category").post(qamController.createCategory);
router.route("/delete_category/:id").get(qamController.deleteCategory);

router.route("/edit_category/:id").post(qamController.updateCategory);

router.route("/download").get(qamController.getDownload);
router.route("/download_csv").get(qamController.downloadCSV);
router.route("/download_zip/:id").get(qamController.downloadZip);

router.route("/dashBoardData").get(qamController.getDashboard);

module.exports = router;
