import { createSignal, Show, splitProps, onCleanup, createEffect } from 'solid-js';
import styles from '../../../assets/index.css';
import { BubbleButton } from './BubbleButton';
import { BubbleParams } from '../types';
import { Bot, BotProps } from '../../../components/Bot';
import Tooltip from './Tooltip';
import { getBubbleButtonSize } from '@/utils';

const defaultButtonColor = '#3B81F6';
const defaultIconColor = 'white';

export type BubbleProps = BotProps & BubbleParams;

export const Bubble = (props: BubbleProps) => {
  const [bubbleProps] = splitProps(props, ['theme']);

  const [isBotOpened, setIsBotOpened] = createSignal(false);
  const [isBotStarted, setIsBotStarted] = createSignal(false);
  const [buttonPosition, setButtonPosition] = createSignal({
    bottom: bubbleProps.theme?.button?.bottom ?? 20,
    right: bubbleProps.theme?.button?.right ?? 20,
  });
  const [chatWindowSize, setChatWindowSize] = createSignal({
    width: bubbleProps.theme?.chatWindow?.width ?? 400,
    height: bubbleProps.theme?.chatWindow?.height ?? 704,
  });
  const [isSplitView, setIsSplitView] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);

  let botRef: HTMLDivElement | undefined;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  createEffect(() => {
    if (isSplitView()) {
      const width = chatWindowSize().width;
      document.body.style.marginRight = `${width}px`;
      document.body.style.transition = 'margin-right 200ms ease-out';
    } else {
      document.body.style.marginRight = '';
      document.body.style.transition = '';
    }
    // Cleanup
    onCleanup(() => {
      document.body.style.marginRight = '';
      document.body.style.transition = '';
    });
  });

  /* Resize Logic */
  const [resizeAxis, setResizeAxis] = createSignal<'x' | 'y' | 'both'>('both');

  const onResizeStart = (e: MouseEvent | TouchEvent, axis: 'x' | 'y' | 'both' = 'both') => {
    e.preventDefault();
    setIsResizing(true);
    setResizeAxis(axis);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    if (botRef) {
      startWidth = botRef.offsetWidth;
      startHeight = botRef.offsetHeight;
    }

    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', onResizeEnd);
    window.addEventListener('touchmove', onResize);
    window.addEventListener('touchend', onResizeEnd);
  };

  const onResize = (e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = startX - clientX;
    const deltaY = startY - clientY;

    if (isSplitView()) {
      const newWidth = Math.max(300, startWidth + deltaX);
      setChatWindowSize((prev) => ({ ...prev, width: newWidth }));
    } else {
      const newSize = { ...chatWindowSize() };
      const axis = resizeAxis();

      if (axis === 'x' || axis === 'both') {
        newSize.width = Math.max(300, startWidth + deltaX);
      }
      if (axis === 'y' || axis === 'both') {
        newSize.height = Math.max(400, startHeight + deltaY);
      }

      setChatWindowSize(newSize);
    }
  };

  const onResizeEnd = () => {
    setIsResizing(false);
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', onResizeEnd);
    window.removeEventListener('touchmove', onResize);
    window.removeEventListener('touchend', onResizeEnd);
  };

  const openBot = () => {
    if (!isBotStarted()) setIsBotStarted(true);
    setIsBotOpened(true);
  };

  const closeBot = () => {
    setIsBotOpened(false);
  };

  const toggleBot = () => {
    isBotOpened() ? closeBot() : openBot();
  };

  onCleanup(() => {
    setIsBotStarted(false);
  });

  const buttonSize = getBubbleButtonSize(props.theme?.button?.size); // Default to 48px if size is not provided
  const buttonBottom = props.theme?.button?.bottom ?? 20;
  const chatWindowBottom = buttonBottom + buttonSize + 10; // Adjust the offset here for slight shift

  // Add viewport meta tag dynamically
  createEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, interactive-widget=resizes-content';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  });

  const showTooltip = bubbleProps.theme?.tooltip?.showTooltip ?? false;

  return (
    <>
      <Show when={props.theme?.customCSS}>
        <style>{props.theme?.customCSS}</style>
      </Show>
      <style>{styles}</style>
      <Tooltip
        showTooltip={showTooltip && !isBotOpened()}
        position={buttonPosition()}
        buttonSize={buttonSize}
        tooltipMessage={bubbleProps.theme?.tooltip?.tooltipMessage}
        tooltipBackgroundColor={bubbleProps.theme?.tooltip?.tooltipBackgroundColor}
        tooltipTextColor={bubbleProps.theme?.tooltip?.tooltipTextColor}
        tooltipFontSize={bubbleProps.theme?.tooltip?.tooltipFontSize} // Set the tooltip font size
      />
      <BubbleButton
        {...bubbleProps.theme?.button}
        toggleBot={toggleBot}
        isBotOpened={isBotOpened()}
        setButtonPosition={setButtonPosition}
        dragAndDrop={bubbleProps.theme?.button?.dragAndDrop ?? false}
        autoOpen={bubbleProps.theme?.button?.autoWindowOpen?.autoOpen ?? false}
        openDelay={bubbleProps.theme?.button?.autoWindowOpen?.openDelay}
        autoOpenOnMobile={bubbleProps.theme?.button?.autoWindowOpen?.autoOpenOnMobile ?? false}
      />
      <div
        part="bot"
        ref={botRef}
        style={{
          height: isSplitView() ? '100vh' : `${chatWindowSize().height}px`,
          width: `${chatWindowSize().width}px`,
          transition: isResizing()
            ? 'none'
            : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out, width 200ms ease-out, height 200ms ease-out',
          'transform-origin': 'bottom right',
          transform: isBotOpened() ? 'scale3d(1, 1, 1)' : 'scale3d(0, 0, 1)',
          'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.12)',
          'background-color': bubbleProps.theme?.chatWindow?.backgroundColor || '#ffffff',
          'background-image': bubbleProps.theme?.chatWindow?.backgroundImage ? `url(${bubbleProps.theme?.chatWindow?.backgroundImage})` : 'none',
          'background-size': 'cover',
          'background-position': 'center',
          'background-repeat': 'no-repeat',
          'z-index': 42424242,
          bottom: isSplitView() ? '0' : `${Math.min(buttonPosition().bottom + buttonSize + 10, window.innerHeight - chatWindowBottom)}px`,
          right: isSplitView()
            ? '0'
            : `${Math.max(0, Math.min(buttonPosition().right, window.innerWidth - (bubbleProps.theme?.chatWindow?.width ?? 410) - 10))}px`,
          top: isSplitView() ? '0' : undefined,
          'border-radius': isSplitView() ? '0' : 'var(--chatbot-border-radius)',
        }}
        class={
          (isSplitView()
            ? 'fixed right-0 top-0 h-full transition-all duration-200'
            : `fixed sm:right-5 rounded-[var(--chatbot-border-radius)] transition-colors bottom-${chatWindowBottom}px`) +
          (isBotOpened() ? ' opacity-1' : ' opacity-0 pointer-events-none')
        }
      >
        {/* Top-Left Corner (Both) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '15px',
            height: '15px',
            cursor: 'nwse-resize',
            'z-index': 51,
          }}
          onMouseDown={(e) => onResizeStart(e, 'both')}
          onTouchStart={(e) => onResizeStart(e, 'both')}
        />
        {/* Left Edge (X-axis) */}
        <div
          style={{
            position: 'absolute',
            top: '15px',
            left: 0,
            width: '10px',
            height: 'calc(100% - 15px)',
            cursor: 'ew-resize',
            'z-index': 50,
          }}
          onMouseDown={(e) => onResizeStart(e, 'x')}
          onTouchStart={(e) => onResizeStart(e, 'x')}
        />
        {/* Top Edge (Y-axis) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15px',
            width: 'calc(100% - 15px)',
            height: '10px',
            cursor: 'ns-resize',
            'z-index': 50,
          }}
          onMouseDown={(e) => onResizeStart(e, 'y')}
          onTouchStart={(e) => onResizeStart(e, 'y')}
        />
        <Show when={isBotStarted()}>
          <div class="relative h-full">

            <Bot
              backgroundColor={bubbleProps.theme?.chatWindow?.backgroundColor}
              formBackgroundColor={bubbleProps.theme?.form?.backgroundColor}
              formTextColor={bubbleProps.theme?.form?.textColor}
              badgeBackgroundColor={bubbleProps.theme?.chatWindow?.backgroundColor}
              bubbleBackgroundColor={bubbleProps.theme?.button?.backgroundColor ?? defaultButtonColor}
              bubbleTextColor={bubbleProps.theme?.button?.iconColor ?? defaultIconColor}
              showTitle={bubbleProps.theme?.chatWindow?.showTitle}
              showAgentMessages={bubbleProps.theme?.chatWindow?.showAgentMessages}
              title={bubbleProps.theme?.chatWindow?.title}
              titleAvatarSrc={bubbleProps.theme?.chatWindow?.titleAvatarSrc}
              titleTextColor={bubbleProps.theme?.chatWindow?.titleTextColor}
              titleBackgroundColor={bubbleProps.theme?.chatWindow?.titleBackgroundColor}
              welcomeMessage={bubbleProps.theme?.chatWindow?.welcomeMessage}
              errorMessage={bubbleProps.theme?.chatWindow?.errorMessage}
              poweredByTextColor={bubbleProps.theme?.chatWindow?.poweredByTextColor}
              textInput={bubbleProps.theme?.chatWindow?.textInput}
              botMessage={bubbleProps.theme?.chatWindow?.botMessage}
              userMessage={bubbleProps.theme?.chatWindow?.userMessage}
              feedback={bubbleProps.theme?.chatWindow?.feedback}
              fontSize={bubbleProps.theme?.chatWindow?.fontSize}
              footer={bubbleProps.theme?.chatWindow?.footer}
              sourceDocsTitle={bubbleProps.theme?.chatWindow?.sourceDocsTitle}
              starterPrompts={bubbleProps.theme?.chatWindow?.starterPrompts}
              starterPromptFontSize={bubbleProps.theme?.chatWindow?.starterPromptFontSize}
              chatflowid={props.chatflowid}
              chatflowConfig={props.chatflowConfig}
              apiHost={props.apiHost}
              onRequest={props.onRequest}
              observersConfig={props.observersConfig}
              clearChatOnReload={bubbleProps.theme?.chatWindow?.clearChatOnReload}
              disclaimer={bubbleProps.theme?.disclaimer}
              dateTimeToggle={bubbleProps.theme?.chatWindow?.dateTimeToggle}
              renderHTML={props.theme?.chatWindow?.renderHTML}
              closeBot={closeBot}
              isSplitView={isSplitView()}
              toggleSplitView={() => setIsSplitView(!isSplitView())}
            />
          </div>
        </Show>
      </div>
    </>
  );
};
