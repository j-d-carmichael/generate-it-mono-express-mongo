import { readFile } from 'fs';

export default (absOpenApiFilePath: string) => {
  return new Promise<string[]>((resolve, reject) => {
    readFile(absOpenApiFilePath, (err, data) => {
      if (err) {
        return reject(err);
      } else {
        resolve(
          data
            .toString('utf8')
            .split('\n')
            .reduce<string[]>(
              (perms, line) => {
                const match = line.match(/^.*x-permission: ?(.*)$/);
                if (match) {
                  return perms.concat(match[1]);
                }
                return perms;
              },
              []
            )
        );
      }
    });
  });
}
