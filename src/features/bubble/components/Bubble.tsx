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
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);

  const canvasWidthConfig = bubbleProps.theme?.chatWindow?.canvasWidth;
  // Resolves the canvas panel width to a CSS string value.
  // Only applies when canvasWidth is explicitly configured; otherwise the existing resizable behavior is used.
  const canvasWidthCSS = () => {
    if (canvasWidthConfig === undefined) return `${chatWindowSize().width}px`;
    if (isMobile()) return '100vw';
    return typeof canvasWidthConfig === 'number' ? `${canvasWidthConfig}px` : canvasWidthConfig;
  };

  const onWindowResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener('resize', onWindowResize);

  let botRef: HTMLDivElement | undefined;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let resizeDirection: 'left' | 'top' | 'corner' = 'left';

  createEffect(() => {
    if (isSplitView()) {
      // Fixed canvas width configured + mobile fullscreen: don't push the body
      document.body.style.marginRight = canvasWidthConfig !== undefined && isMobile() ? '' : canvasWidthCSS();
      document.body.style.transition = 'margin-right 200ms ease-out';
    } else {
      document.body.style.marginRight = '';
      document.body.style.transition = '';
    }
    onCleanup(() => {
      document.body.style.marginRight = '';
      document.body.style.transition = '';
    });
  });

  const onResizeStart = (e: MouseEvent | TouchEvent, direction: 'left' | 'top' | 'corner' = 'left') => {
    e.preventDefault();
    setIsResizing(true);
    resizeDirection = direction;
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

    const resizeWidth = resizeDirection === 'left' || resizeDirection === 'corner';
    const resizeHeight = resizeDirection === 'top' || resizeDirection === 'corner';

    if (isSplitView()) {
      if (resizeWidth) {
        setChatWindowSize((prev) => ({ ...prev, width: Math.max(300, startWidth + deltaX) }));
      }
    } else {
      setChatWindowSize((prev) => ({
        width: resizeWidth ? Math.max(300, startWidth + deltaX) : prev.width,
        height: resizeHeight ? Math.max(400, startHeight + deltaY) : prev.height,
      }));
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
    if (isSplitView()) setIsSplitView(false);
  };

  const toggleBot = () => {
    isBotOpened() ? closeBot() : openBot();
  };

  onCleanup(() => {
    setIsBotStarted(false);
    window.removeEventListener('resize', onWindowResize);
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
          width: isSplitView() ? canvasWidthCSS() : `${chatWindowSize().width}px`,
          transition: isResizing()
            ? 'none'
            : 'transform 200ms cubic-bezier(0, 1.2, 1, 1), opacity 150ms ease-out, width 200ms ease-out, height 200ms ease-out',
          'transform-origin': 'bottom right',
          transform: isBotOpened() ? 'scale3d(1, 1, 1)' : 'scale3d(0, 0, 1)',
          'box-shadow': 'rgb(0 0 0 / 16%) 0px 5px 40px',
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
          'border-top-left-radius': isSplitView() ? (canvasWidthConfig !== undefined && isMobile() ? '0' : '6px') : undefined,
          'border-top-right-radius': isSplitView() ? '0' : undefined,
          'border-bottom-left-radius': isSplitView() ? '0' : undefined,
          'border-bottom-right-radius': isSplitView() ? '0' : undefined,
          overflow: isSplitView() ? 'hidden' : undefined,
        }}
        class={
          (isSplitView()
            ? 'fixed right-0 top-0 h-full transition-all duration-200'
            : `fixed sm:right-5 rounded-lg transition-colors bottom-${chatWindowBottom}px`) +
          (isBotOpened() ? ' opacity-1' : ' opacity-0 pointer-events-none')
        }
      >
        {/* Resize handles — hidden in canvas mode only when canvasWidth is configured (fixed width) */}
        <Show when={!isSplitView() || canvasWidthConfig === undefined}>
          {/* Left edge */}
          <div
            style={{ position: 'absolute', top: '12px', left: 0, width: '6px', height: 'calc(100% - 12px)', cursor: 'ew-resize', 'z-index': 50 }}
            onMouseDown={(e) => onResizeStart(e, 'left')}
            onTouchStart={(e) => onResizeStart(e, 'left')}
          />
          {/* Top edge */}
          <div
            style={{ position: 'absolute', top: 0, left: '12px', width: 'calc(100% - 12px)', height: '6px', cursor: 'ns-resize', 'z-index': 50 }}
            onMouseDown={(e) => onResizeStart(e, 'top')}
            onTouchStart={(e) => onResizeStart(e, 'top')}
          />
          {/* Top-left corner */}
          <div
            style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', cursor: 'nw-resize', 'z-index': 51 }}
            onMouseDown={(e) => onResizeStart(e, 'corner')}
            onTouchStart={(e) => onResizeStart(e, 'corner')}
          />
        </Show>
        <Show when={isBotStarted()}>
          <div class="relative h-full">
            <Show when={isBotOpened()}>
              {/* Cross button For only mobile screen use this <Show when={isBotOpened() && window.innerWidth <= 640}>  */}
              <button
                onClick={closeBot}
                class="py-2 pr-3 absolute top-0 right-[-8px] m-[6px] bg-transparent text-white rounded-full z-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75"
                title="Close Chat"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill={bubbleProps.theme?.button?.iconColor ?? defaultIconColor}
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                  />
                </svg>
              </button>
            </Show>
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
