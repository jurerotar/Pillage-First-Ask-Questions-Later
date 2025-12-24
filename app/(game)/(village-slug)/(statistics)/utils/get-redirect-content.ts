export const getRedirectContent = (param: string | null) => {
  if (typeof param === 'string') {
    return {
      title: 'Work In Progress',
      description: 'Requested content not available',
      text: "We're sorry, but Players page is not available yet",
    };
  }
  return null;
};
