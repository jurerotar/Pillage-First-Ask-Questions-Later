import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuList, LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router';
import { useMapMarkers } from 'app/(game)/(village-slug)/(map)/hooks/use-map-markers';
import { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { Icon } from 'app/components/icon';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'app/components/ui/dialog';

export const MapMarkers = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { mapMarkers, deleteMapMarker, isDeletingMapMarker } = useMapMarkers();
  const { map } = useMap();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent md:size-12"
          aria-label={t('Map markers')}
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Map markers')}
          data-testid="map-markers-button"
        >
          <LuList className="size-5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Map markers')}</DialogTitle>
          <DialogDescription>
            {t('Select a marker to go to its map tile.')}
          </DialogDescription>
        </DialogHeader>
        {mapMarkers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('No map markers yet. Add a marker from a map tile.')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {mapMarkers.map((marker) => {
              const tile = map.at(marker.tileId - 1)!;

              const { x, y } = tile.coordinates;

              return (
                <li
                  key={marker.tileId}
                  className="flex items-center gap-2 py-2"
                >
                  <Link
                    to={`?x=${x}&y=${y}`}
                    onClick={() => setIsOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 hover:bg-accent focus-visible:outline focus-visible:outline-ring"
                  >
                    <Icon
                      type={marker.icon}
                      style={{ color: marker.color }}
                      className="size-5 shrink-0"
                      shouldShowTooltip={false}
                    />
                    <span className="min-w-0">
                      <span className="block whitespace-pre-wrap wrap-break-word text-sm">
                        {marker.description || t('Map marker')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({x}|{y})
                      </span>
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('Remove marker at ({{x}}|{{y}})', { x, y })}
                    disabled={isDeletingMapMarker}
                    onClick={() => deleteMapMarker({ tileId: marker.tileId })}
                  >
                    <LuTrash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};
