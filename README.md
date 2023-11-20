1. First create a config.json in the project root. Fill in your telegram bot token.
```shell
echo '{"token":"<your bot token>"}' > config.json
```
2. Install dependencies.
```shell
yarn
```
3. Run with node.
```shell
node .
```
4. Add the bot into a supergroup and promote it to admin.
5. Use bot command "/restrict" and follow the instructions.
6. Manually check the supergroup status in Telgram "Manage group". Status will also be output in console.