const express = require("express");
const subscriptionRouter = express.Router();
const ctrl = require("../controllers/subscriptionController");


subscriptionRouter.post("/", ctrl.createSubscription);
subscriptionRouter.get("/", ctrl.getSubscriptions);
subscriptionRouter.get("/:id", ctrl.getSubscriptionById);
subscriptionRouter.put("/:id", ctrl.updateSubscription);
subscriptionRouter.delete("/:id", ctrl.deleteSubscription);


module.exports = subscriptionRouter;