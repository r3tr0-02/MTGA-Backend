const { database } = require("../../app");
const { Account } = require('../models/Account');
const { Item } = require('../models/Item');
const { Language } = require('../models/Language');
const { Locale } = require('../models/Locale');
const { Customization } = require('../models/Customization');
const { HideoutArea } = require('../models/HideoutArea');
const { HideoutProduction } = require('../models/HideoutProduction');
const { HideoutScavcase } = require('../models/HideoutScavcase');
const { Quest } = require('../models/Quest');
const { logger, FastifyResponse } = require("../../utilities");


class ClientController {
    static async clientLocale(request = null, reply = null) {
        const requestedLanguage = request.params.language;
        if (requestedLanguage) {
            const language = await Locale.get(requestedLanguage);
            return FastifyResponse.zlibJsonReply(
                reply,
                FastifyResponse.applyBody(language.locale)
            );
        } else {
            const playerAccount = await Account.get(await FastifyResponse.getSessionID(request));
            const language = await Locale.get(playerAccount.getLanguage());

            if (playerAccount) {
                return FastifyResponse.zlibJsonReply(
                    reply,
                    FastifyResponse.applyBody(language.locale)
                );
            }
        }
    };

    static async clientLanguages(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(await Language.getAllWithoutKeys())
        );
    };

    static async clientItems(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(await Item.getAll())
        );
    };

    static async clientCustomization(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(await Customization.getAll())
        );
    };

    static async clientGlobals(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(database.core.globals)
        );
    };

    static async clientSettings(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(database.core.clientSettings)
        );
    };

    static async clientAccountCustomization(_request = null, reply = null) {
        const customizations = [];
        const nonFiltered = await Customization.getAllWithoutKeys();
        for (const custo of nonFiltered) {
            if (custo._props.Side && custo._props.Side.length > 0) {
                customizations.push(custo._id);
            }
        }
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(customizations)
        );
    };

    static async clientWeather(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(database.weather)
        );
    };

    static async clientLocations(_request = null, reply = null) {
        const baseResponse = database.core.locations;
        logger.logDebug(`Using dumps for locations - will work out a better way later.`);
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(baseResponse)
        );
    };

    static async clientHideoutAreas(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(await HideoutArea.getAllWithoutKeys())
        );
    };

    static async clientHideoutSettings(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(database.core.hideoutSettings)
        );
    };

    static async clientHideoutProductionRecipes(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(await HideoutProduction.getAllWithoutKeys())
        );
    };

    static async clientHideoutProductionScavcaseRecipes(_request = null, reply = null) {
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(await HideoutScavcase.getAllWithoutKeys())
        );
    };

    static async clientQuestList(request = null, reply = null) {
        const playerAccount = await Account.get(await FastifyResponse.getSessionID(request));
        const quests = await Quest.getQuestsForPlayer(playerAccount);
        return FastifyResponse.zlibJsonReply(
            reply,
            FastifyResponse.applyBody(quests)
        );
    };

}

module.exports.ClientController = ClientController;
