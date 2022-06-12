import React from 'react';
import { useContextSelector } from 'use-context-selector';
import { PreferencesContext } from 'providers/preferences-context';
import Toggle from 'components/common/toggle';
import SectionHeading from 'components/common/section-heading';
import { useTranslation } from 'react-i18next';
import Paragraph from 'components/common/paragraph';

const UserPreferences: React.FC = (): JSX.Element => {
  const locale = useContextSelector(PreferencesContext, (v) => v.locale);
  const changeLocale = useContextSelector(PreferencesContext, (v) => v.changeLocale);
  const colorScheme = useContextSelector(PreferencesContext, (v) => v.colorScheme);
  const isAccessibilityModeEnabled = useContextSelector(PreferencesContext, (v) => v.isAccessibilityModeEnabled);
  const isReducedMotionModeEnabled = useContextSelector(PreferencesContext, (v) => v.isReducedMotionModeEnabled);
  const toggleColorScheme = useContextSelector(PreferencesContext, (v) => v.toggleColorScheme);
  const toggleAccessibilityMode = useContextSelector(PreferencesContext, (v) => v.toggleAccessibilityMode);
  const toggleReducedMotionMode = useContextSelector(PreferencesContext, (v) => v.toggleReducedMotionMode);

  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SectionHeading>
          {t('PREFERENCES.MODAL.TITLE')}
        </SectionHeading>
        <Paragraph>
          {t('PREFERENCES.MODAL.DESCRIPTION')}
        </Paragraph>
      </div>
      <div className="flex flex-col gap-2 border-dashed border-y border-gray-300 py-2">
        <SectionHeading className="md:text-base">
          {t('PREFERENCES.COLOR_SCHEME.LABEL')}
        </SectionHeading>
        <Paragraph>
          {t('PREFERENCES.COLOR_SCHEME.DESCRIPTION')}
        </Paragraph>
        <Toggle
          id="preferences-color-scheme"
          checked={colorScheme === 'dark'}
          onChange={toggleColorScheme}
        />
      </div>
      <div className="flex flex-col gap-2 border-dashed border-b border-gray-300 pb-2">
        <SectionHeading className="md:text-base">
          {t('PREFERENCES.ACCESSIBILITY_MODE.LABEL')}
        </SectionHeading>
        <Paragraph>
          {t('PREFERENCES.ACCESSIBILITY_MODE.DESCRIPTION')}
        </Paragraph>
        <Toggle
          id="preferences-accessibility-mode"
          checked={isAccessibilityModeEnabled}
          onChange={toggleAccessibilityMode}
        />
      </div>
      <div className="flex flex-col gap-2">
        <SectionHeading className="md:text-base">
          {t('PREFERENCES.REDUCED_MOTION.LABEL')}
        </SectionHeading>
        <Paragraph>
          {t('PREFERENCES.REDUCED_MOTION.DESCRIPTION')}
        </Paragraph>
        <Toggle
          id="preferences-reduced-motion-mode"
          checked={isReducedMotionModeEnabled}
          onChange={toggleReducedMotionMode}
        />
      </div>
    </div>
  );
};

export default UserPreferences;
