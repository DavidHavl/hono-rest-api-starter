import { GitHub } from 'arctic';

let githubInstance: GitHub | null = null;
export const useGithubProvider = (clientId: string, clientSecret: string, redirectUrl: string) => {
  if (githubInstance) {
    return githubInstance;
  }
  githubInstance = new GitHub(clientId, clientSecret, redirectUrl);
  return githubInstance;
};
