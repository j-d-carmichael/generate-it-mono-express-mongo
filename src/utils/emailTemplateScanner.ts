import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'emails/templates');
const EXCLUDED_FOLDERS = ['_layout', 'support'];

export interface TemplateInfo {
  templateName: string;
  content: string;
}

/**
 * Scans the email templates directory and returns all available templates
 * Excludes _layout and support folders
 */
export function getAvailableTemplates(): TemplateInfo[] {
  const templates: TemplateInfo[] = [];

  if (!fs.existsSync(TEMPLATES_DIR)) {
    return templates;
  }

  const folders = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });

  for (const folder of folders) {
    if (!folder.isDirectory() || EXCLUDED_FOLDERS.includes(folder.name)) {
      continue;
    }

    const folderPath = path.join(TEMPLATES_DIR, folder.name);
    const files = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.html.njk')) {
        continue;
      }

      const templateName = `${folder.name}/${file.name.replace('.html.njk', '')}`;
      const filePath = path.join(folderPath, file.name);
      const content = fs.readFileSync(filePath, 'utf-8');

      templates.push({
        templateName,
        content,
      });
    }
  }

  return templates.sort((a, b) => a.templateName.localeCompare(b.templateName));
}

/**
 * Gets the content of a specific template from the filesystem
 */
export function getTemplateContent(templateName: string): string | null {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html.njk`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf-8');
}
