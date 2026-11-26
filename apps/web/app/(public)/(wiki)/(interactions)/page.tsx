import { redirect } from 'react-router';

export const clientLoader = () => redirect('/wiki/buildings', 301);

export default function InteractionsRedirect() {
  return null;
}
