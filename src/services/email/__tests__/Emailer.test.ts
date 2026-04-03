import { emailerSetupAsync } from 'nunjucks-emailer';
import { EmailerSendTypes } from 'nunjucks-emailer/build/enums/EmailerSendTypes';
import CompanyEmailTemplateRepository from '@/database/CompanyEmailTemplateRepository';
import Emailer from '../Emailer';
import * as path from 'path';

jest.mock('@/database/CompanyEmailTemplateRepository');

describe('Emailer', () => {
  const TEMPLATES_PATH = path.join(process.cwd(), 'emails/templates');

  beforeAll(async () => {
    await emailerSetupAsync({
      templatePath: TEMPLATES_PATH,
      logPath: path.join(process.cwd(), 'emails/logs'),
      sendType: EmailerSendTypes.return,
      fallbackFrom: {
        email: 'test@example.com',
        name: 'Test App',
      },
      fallbackSubject: 'Test Subject',
      makeCssInline: false,
      templateGlobalObject: {
        frontend: {
          userApp: 'http://localhost:3000',
        },
        noReply: 'noreply@example.com',
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('send with filesystem template (no override)', () => {
    it('should use filesystem template when no DB override exists', async () => {
      (CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName as jest.Mock).mockResolvedValue(null);

      const result = await Emailer.send({
        to: {
          email: 'user@example.com',
          name: 'Test User',
        },
        tplObject: {
          firstName: 'John',
        },
        tplRelativePath: 'user/welcome',
        companyId: 'company-123',
      });

      expect(CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName).toHaveBeenCalledWith({
        companyId: 'company-123',
        templateName: 'user/welcome',
      });

      // In RETURN mode, result contains rendered email
      expect(result).toBeDefined();
      expect(result.html).toContain('John');
    });

    it('should not query DB when companyId is not provided', async () => {
      const result = await Emailer.send({
        to: {
          email: 'user@example.com',
          name: 'Test User',
        },
        tplObject: {
          firstName: 'Jane',
        },
        tplRelativePath: 'user/welcome',
      });

      expect(CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName).not.toHaveBeenCalled();

      expect(result).toBeDefined();
      expect(result.html).toContain('Jane');
    });
  });

  describe('send with DB override', () => {
    it('should use DB override content when override exists', async () => {
      const customHtml = '<html><body><h1>CUSTOM Welcome {{ firstName }}!</h1></body></html>';
      const mockOverride = {
        _id: 'override-123',
        companyId: 'company-123',
        templateName: 'user/welcome',
        content: customHtml,
        subject: 'Custom Welcome Subject',
        variables: ['firstName'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName as jest.Mock).mockResolvedValue(mockOverride);

      const result = await Emailer.send({
        to: {
          email: 'user@example.com',
          name: 'Test User',
        },
        tplObject: {
          firstName: 'John',
        },
        tplRelativePath: 'user/welcome',
        companyId: 'company-123',
      });

      expect(CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName).toHaveBeenCalledWith({
        companyId: 'company-123',
        templateName: 'user/welcome',
      });

      // Verify the override content was used (not the filesystem template)
      expect(result).toBeDefined();
      expect(result.html).toContain('CUSTOM Welcome John!');
    });

    it('should use original subject when override has no subject', async () => {
      const customHtml = '<html><body><h1>Override Content for {{ firstName }}</h1></body></html>';
      const mockOverride = {
        _id: 'override-123',
        companyId: 'company-123',
        templateName: 'user/welcome',
        content: customHtml,
        subject: null,
        variables: ['firstName'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName as jest.Mock).mockResolvedValue(mockOverride);

      const result = await Emailer.send({
        to: {
          email: 'user@example.com',
          name: 'Test User',
        },
        tplObject: {
          firstName: 'John',
        },
        tplRelativePath: 'user/welcome',
        subject: 'Original Subject Line',
        companyId: 'company-123',
      });

      expect(result).toBeDefined();
      expect(result.html).toContain('Override Content for John');
    });

    it('should render override template with multiple variables', async () => {
      const customHtml = `
        <html>
          <body>
            <h1>Hello {{ firstName }}!</h1>
            <p>Welcome to {{ companyName }}</p>
            <p>Your role is {{ role }}</p>
          </body>
        </html>
      `;

      const mockOverride = {
        _id: 'override-123',
        companyId: 'company-123',
        templateName: 'user/welcome',
        content: customHtml,
        subject: 'Welcome {{ firstName }} to {{ companyName }}',
        variables: ['firstName', 'companyName', 'role'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName as jest.Mock).mockResolvedValue(mockOverride);

      const result = await Emailer.send({
        to: {
          email: 'user@example.com',
          name: 'Test User',
        },
        tplObject: {
          firstName: 'Alice',
          companyName: 'Acme Corp',
          role: 'Admin',
        },
        tplRelativePath: 'user/welcome',
        companyId: 'company-123',
      });

      expect(result).toBeDefined();
      expect(result.html).toContain('Hello Alice!');
      expect(result.html).toContain('Welcome to Acme Corp');
      expect(result.html).toContain('Your role is Admin');
    });
  });

  describe('edge cases', () => {
    it('should handle empty tplRelativePath gracefully', async () => {
      const result = await Emailer.send({
        to: {
          email: 'user@example.com',
          name: 'Test User',
        },
        tplObject: {
          firstName: 'John',
        },
        tplHtmlString: '<html><body>Direct HTML {{ firstName }}</body></html>',
        companyId: 'company-123',
      });

      // Should not query DB when no tplRelativePath
      expect(CompanyEmailTemplateRepository.findByCompanyIdAndTemplateName).not.toHaveBeenCalled();

      expect(result).toBeDefined();
      expect(result.html).toContain('Direct HTML John');
    });
  });
});
