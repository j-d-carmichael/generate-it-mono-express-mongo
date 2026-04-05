import { Emailer as NunjucksEmailer } from 'nunjucks-emailer';
import EmailerSend from 'nunjucks-emailer/build/interfaces/EmailerSend';


class Emailer {
  async send(input: EmailerSend): Promise<any> {
    try {
      return await NunjucksEmailer.send(input);
    } catch (err) {
      const recipient = typeof input.to === 'string' ? input.to : input.to.email;
      console.error(`Failed to send email to ${recipient}:`, err);
      throw err;
    }
  }
}

export default new Emailer();
