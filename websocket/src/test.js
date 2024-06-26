import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { text } from 'input'; // npm i input

const apiId = 123456;
const apiHash = '123456abcdfg';
const stringSession = new StringSession(''); // fill this later with the value from session.save()

(async () => {
  console.log('Loading interactive example...');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await text('Please enter your number: '),
    password: async () => await text('Please enter your password: '),
    phoneCode: async () => await text('Please enter the code you received: '),
    onError: (err) => console.log(err),
  });
  console.log('You should now be connected.');
  const d = await client.getDialogs({ limit: 10 });
  console.log(d);
  console.log(client.session.save()); // Save this string to avoid logging in again
  await client.sendMessage('me', { message: 'Hello!' });
})();
