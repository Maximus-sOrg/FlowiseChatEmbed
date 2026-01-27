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

  const onResizeStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
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
      // In split view, we only resize width, passing height back to effect if needed or just letting CSS handle 100vh
      // But since we set style height, we might want to update it to window.innerHeight or similar, or just ignore height updates in style val
    } else {
      setChatWindowSize({
        width: Math.max(300, startWidth + deltaX),
        height: Math.max(400, startHeight + deltaY),
      });
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
            : 'transform 200ms cubic-bezier(0, 1.2, 1, 1), opacity 150ms ease-out, width 200ms ease-out, height 200ms ease-out',
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
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '20px',
            height: '100%',
            cursor: 'ew-resize',
            'z-index': 50,
          }}
          onMouseDown={onResizeStart}
          onTouchStart={onResizeStart}
        />
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
