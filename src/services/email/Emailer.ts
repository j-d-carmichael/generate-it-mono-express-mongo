import { Emailer as NunjucksEmailer } from 'nunjucks-emailer';
import EmailerSend from 'nunjucks-emailer/build/interfaces/EmailerSend';
import CompanyEmailTemplateRepository from '@/database/CompanyEmailTemplateRepository';

interface EmailerSendWithCompany extends EmailerSend {
  companyId?: string;
}

class Emailer {
  async send(input: EmailerSendWithCompany): Promise<any> {
    try {
      const finalInput = await this.resolveTemplate(input);
      return await NunjucksEmailer.send(finalInput);
    } catch (err) {
      const recipient = typeof input.to === 'string' ? input.to : input.to.email;
      console.error(`Failed to send email to ${recipient}:`, err);
      throw err;
    }
  }

  private async resolveTemplate(input: EmailerSendWithCompany): Promise<EmailerSend> {
    if (!input.companyId || !input.tplRelativePath) {
      return input;
    }

    const override = await CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName({
      companyId: input.companyId,
      templateName: input.tplRelativePath,
    });

    if (!override) {
      return input;
    }

    // This is shorthand for excluding those vars from rest - but lint doesn't get it :/
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { companyId, tplRelativePath, ...rest } = input;
    return {
      ...rest,
      tplHtmlString: override.content,
      subject: override.subject || input.subject,
    };
  }
}

export default new Emailer();
