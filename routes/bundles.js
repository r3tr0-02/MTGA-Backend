/**
 * GET:/getBundleList
 */
const { BundlesController } = require("../lib/controllers");
const { logger } = require("../utilities");


module.exports = async function bundlesRoutes(app, _opts) {

  app.get(`/getBundleList`, async (request, reply) => {
    logger.logWarning("Bundles not implemented yet")
    await BundlesController.getBundles(reply);
  })

}