import { useMutation } from '@tanstack/react-query';
import { request } from '../../api';

export const useDownloadWorld = (token: string) => {
  return useMutation({
    mutationFn: async (world: { id: string; downloadUrl: string }) => {
      const response = await request(token, world.downloadUrl);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${world.id}.sqlite3`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
};
