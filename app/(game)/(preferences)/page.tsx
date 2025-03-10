import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { usePreferences } from 'app/(game)/hooks/use-preferences';
import { Toggle } from 'app/components/toggle';
import { Text } from 'app/components/text';

const PreferencesPage = () => {
  const { togglePreference, shouldShowBuildingNames, isAccessibilityModeEnabled, isReducedMotionModeEnabled } = usePreferences();
  const { isDeveloperModeActive, toggleDeveloperMode } = useDeveloperMode();

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h1">Preferences</Text>
        <div className="flex gap-2 border-b border-gray-300 py-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">Developer mode</span>
            Enables instant building of buildings and troops with no cost.
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Toggle
              className="flex flex-1"
              id="develop-mode-toggle"
              onChange={toggleDeveloperMode}
              checked={isDeveloperModeActive}
            />
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-300 py-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">Building names display</span>
            Shows the names of buildings on village and resources views.
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Toggle
              className="flex flex-1"
              id="should-show-building-names-toggle"
              onChange={() => togglePreference('shouldShowBuildingNames')}
              checked={shouldShowBuildingNames}
            />
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-300 py-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">Reduced motion (in development)</span>
            Disables certain animations and effects for a smoother experience.
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Toggle
              disabled
              className="flex flex-1"
              id="reduced-motion-mode-toggle"
              onChange={() => togglePreference('isReducedMotionModeEnabled')}
              checked={isReducedMotionModeEnabled}
            />
          </div>
        </div>

        <div className="flex gap-2 py-2">
          <Text
            as="p"
            className="flex flex-4 gap-1 flex-col"
          >
            <span className="font-medium">Additional accessibility features (in development))</span>
            Enables accessibility enhancements for better usability.
          </Text>
          <div className="flex flex-1 justify-end items-center">
            <Toggle
              disabled
              className="flex flex-1"
              id="accessibility-mode-toggle"
              onChange={() => togglePreference('isAccessibilityModeEnabled')}
              checked={isAccessibilityModeEnabled}
            />
          </div>
        </div>
      </section>
    </article>
  );
};

export default PreferencesPage;
