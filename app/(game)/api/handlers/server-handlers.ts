import { serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { ApiHandler } from 'app/interfaces/api';
import type { Server } from 'app/interfaces/models/game/server';

export const getServer: ApiHandler<Server> = async (queryClient) => {
  return queryClient.getQueryData<Server>([serverCacheKey])!;
};

// const togglePreference = (
//   preference: keyof Pick<Preferences, 'isReducedMotionModeEnabled' | 'isAccessibilityModeEnabled' | 'shouldShowBuildingNames'>,
// ) => {
//   queryClient.setQueryData<Preferences>([preferencesCacheKey], (prevState) => {
//     // This is a very hacky way of getting rid of this annoying prevState being undefined error
//     if (!prevState) {
//       return;
//     }
//
//     return {
//       ...prevState,
//       [preference]: !prevState[preference],
//     };
//   });
// };
//
// type UpdatePreferenceArgs = {
//   preference: keyof Pick<Preferences, 'isReducedMotionModeEnabled' | 'isAccessibilityModeEnabled' | 'shouldShowBuildingNames'>;
// };
//
// export const updatePreference: ApiHandler<void, void> = async (queryClient) => {
//   queryClient.setQueryData<Preferences>([preferencesCacheKey], (prevState) => {
//     // This is a very hacky way of getting rid of this annoying prevState being undefined error
//     if (!prevState) {
//       return;
//     }
//
//     return {
//       ...prevState,
//       [preference]: !prevState[preference],
//     };
//   });
// };
