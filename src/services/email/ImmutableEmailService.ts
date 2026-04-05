import Emailer from '@/services/email/Emailer';
import config from '@/config';

class ImmutableEmailService {
  /**
   * system emails
   */
  async systemEmail(content: any = {}, rmqOpId: string) {
    const subject: string = config.env.toUpperCase() + ': ';
    void Emailer.send({
      to: {
        email: config.email.techEmail,
        name: `${config.appDetails.name} Support team`,
      },
      subject: subject,
      tplObject: {
        fromOperation: rmqOpId,
        env: config.env,
        providedContent: content,
      },
      tplRelativePath: 'support/generalSystemError',
    });
  }
}

export default new ImmutableEmailService();
