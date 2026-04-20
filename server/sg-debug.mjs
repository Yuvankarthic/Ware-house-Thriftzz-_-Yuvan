import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const key = process.env.SENDGRID_API_KEY;
const from = process.env.MAIL_FROM;
const to = process.env.MAIL_FROM;

(async () => {
  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: 'WHT direct provider check',
        content: [{ type: 'text/plain', value: 'provider check' }]
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('STATUS', response.status);
    console.log(JSON.stringify(response.data || {}, null, 2));
  } catch (error) {
    console.log('STATUS', error.response ? error.response.status : 'ERR');
    console.log(JSON.stringify(error.response ? error.response.data : { message: error.message }, null, 2));
  }
})();
