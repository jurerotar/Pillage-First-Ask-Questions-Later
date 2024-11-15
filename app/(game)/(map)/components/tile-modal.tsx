import { Icon } from 'app/components/icon';
import type { Tile } from 'app/interfaces/models/game/tile';
import clsx from 'clsx';
import type React from 'react';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEventListener, useOnClickOutside } from 'usehooks-ts';

const TileModalButton: React.FCWithChildren<React.HTMLAttributes<HTMLButtonElement>> = ({ children, className, ...rest }) => {
  return (
    <button
      {...rest}
      type="button"
      className={clsx(
        'flex justify-center items-center absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 border-4 border-gray-200 duration-300 transition-colors hover:bg-white',
        className,
      )}
    >
      {children}
    </button>
  );
};

type TileModalProps = {
  tile: Tile;
  onClose: () => void;
};

export const TileModal: React.FC<TileModalProps> = ({ tile, onClose }) => {
  const container = document.querySelector(`[data-tile-id="${tile.id}"]`)!;

  const modalRef = useRef<HTMLDivElement>(null);

  useEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  });

  useEventListener('mouseleave', onClose, modalRef);

  useOnClickOutside(modalRef, onClose);

  useEventListener(
    'touchstart',
    (event) => {
      if (!modalRef.current || event.target) {
        return;
      }

      if (!modalRef.current.contains(event.target)) {
        onClose();
      }
    },
    modalRef,
  );

  return createPortal(
    <div
      ref={modalRef}
      className="absolute absolute-centering size-52 z-20 flex justify-center items-center"
    >
      <div className="relative size-40 rounded-full border-8 border-white/60">
        <div className="absolute size-36 absolute-centering rounded-full border-8 border-gray-400/60" />
        <TileModalButton className="top-0 left-1/2 size-12">
          <Icon
            type="attack"
            className="size-6"
          />
        </TileModalButton>
        {/* <TileModalButton className="top-[22px] right-[-15px] size-8"> */}
        {/*   <Icon */}
        {/*     type="attack" */}
        {/*     className="size-4" */}
        {/*   /> */}
        {/* </TileModalButton> */}
        <TileModalButton className="top-1/2 left-full size-10">
          <Icon
            type="attack"
            className="size-5"
          />
        </TileModalButton>
        <TileModalButton className="top-full left-1/2 size-10">
          <Icon
            type="attack"
            className="size-5"
          />
        </TileModalButton>
        <TileModalButton className="top-1/2 left-0 size-10">
          <Icon
            type="attack"
            className="size-5"
          />
        </TileModalButton>
        {/* <TileModalButton className="top-[22px] left-[16px] size-8"> */}
        {/*   <Icon */}
        {/*     type="attack" */}
        {/*     className="size-4" */}
        {/*   /> */}
        {/* </TileModalButton> */}
      </div>
    </div>,
    container,
  );
};
