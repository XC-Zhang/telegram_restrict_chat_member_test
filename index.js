const TelegramBot = require("node-telegram-bot-api");
const { token } = require("./config.json");
const bot = new TelegramBot(token, { polling: true });

const StartCommandReply = "With the bot you can change the permissions of a user in certain group. The bot should have administrator rights in the group. Start by typing /restrict";
const ChooseGroupReply = "Choose a supergroup.";
const ChooseGroupButton = "Choose group";
const ChooseUserReply = "Choose a user in that group.";
const ChooseUserButton = "Choose user";

/**
 * @param {TelegramBot.Message} message 
 */
function getBotCommand (message) {
    if (!message.entities || !message.text) {
        return;
    }
    const entity = message.entities.find(it => it.type === "bot_command");
    if (!entity) {
        return;
    }
    const botCommand = message.text.slice(entity.offset, entity.offset + entity.length);
    const index = botCommand.indexOf("@");
    if (index === -1) {
        return botCommand;
    }
    return botCommand.slice(0, index);
}

/**
 * @param {number} id 
 * @returns {TelegramBot.ReplyKeyboardMarkup}
 */
function getChoosingGroupReply (id) {
    return {
        keyboard: [
            [
                {
                    text: ChooseGroupButton,
                    request_chat: {
                        request_id: id,
                        chat_is_channel: false,
                        user_administrator_rights: { can_restrict_members: true },
                        bot_administrator_rights: { can_restrict_members: true },
                        bot_is_member: true
                    }
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    };
}

/**
 * @param {number} id 
 * @returns {TelegramBot.ReplyKeyboardMarkup}
 */
function getChoosingUserReply (id) {
    return {
        keyboard: [
            [
                {
                    text: ChooseUserButton,
                    request_user: {
                        request_id: id
                    }
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    };
}

/**
 * @type {{ [id: number]: { botChatId: number; chooseGroupMessageId: number; chooseUserMessageId: number; groupId: number; userId: number; }}}
 */
const toRestrict = {};

bot.on("message", function (message, metadata) {
    const botCommand = getBotCommand(message);
    if (botCommand) {
        if (botCommand === "/start") {
            bot.sendMessage(message.chat.id, StartCommandReply, {
                reply_to_message_id: message.message_id
            });
        } else if (botCommand === "/restrict") {
            bot.sendMessage(message.chat.id, ChooseGroupReply, {
                reply_markup: getChoosingGroupReply(message.message_id),
                reply_to_message_id: message.message_id
            }).then(function (msg) {
                toRestrict[message.message_id] = {
                    botChatId: msg.chat.id,
                    chooseGroupMessageId: msg.message_id
                };
            });
        }
    } else if (message.chat_shared) {
        const toRestrictItem = toRestrict[message.chat_shared.request_id];
        toRestrictItem.groupId = message.chat_shared.chat_id;
        bot.sendMessage(toRestrictItem.botChatId, ChooseUserReply, {
            reply_markup: getChoosingUserReply(message.chat_shared.request_id),
            reply_to_message_id: toRestrictItem.chooseGroupMessageId
        }).then(function (msg) {
            toRestrictItem.chooseUserMessageId = msg.message_id;
        });
    } else if (message.user_shared) {
        const toRestrictItem = toRestrict[message.user_shared.request_id];
        toRestrictItem.userId = message.user_shared.user_id;
        bot.getChatMember(toRestrictItem.groupId, toRestrictItem.userId).then(function (chatMember) {
            console.log("Before restrict:", chatMember);
            bot.restrictChatMember(toRestrictItem.groupId, toRestrictItem.userId, {
                use_independent_chat_permissions: true,
                permissions: JSON.stringify({ can_send_messages: true, can_send_audios: false, can_send_videos: false, can_send_documents: true })
            }).then(function (result) {
                bot.sendMessage(toRestrictItem.botChatId, `restrictChatMember result: ${result}`, {
                    reply_to_message_id: toRestrictItem.chooseUserMessageId
                });
                bot.getChatMember(toRestrictItem.groupId, toRestrictItem.userId).then(function (chatMember) {
                    console.log("After restrict:", chatMember);
                });
            });
        });
    }
});
