(function () {
  const { PluginApi } = window;
  const { React, ReactDOM } = PluginApi;
  const { Bootstrap, FontAwesomeSolid, Intl } = PluginApi.libraries;
  const { Nav, Tab, Button, ButtonGroup, Dropdown, Modal, 
    Form, OverlayTrigger, Tooltip
  } = Bootstrap;
  const { Icon, } = PluginApi.components;
  const { faGear } = FontAwesomeSolid;
  const { useConfiguration } = PluginApi.utils.StashService;
  const { IntlProvider, FormattedMessage } = Intl;

  const pluginID = 'external-player-support'
  const iconsPath = "./plugin/external-player-support/assets/icons";
  const localesBase = `./plugin/external-player-support/assets/locales`;
  const storageKey = `${pluginID}.settings`;

  const playerButtons = [
    { id: "iina", name: "IINA", onClick: openIINA },
    { id: "infuse", name: "Infuse", onClick: openInfuse },
    { id: "mpchc", name: "MPC-HC", onClick: openMPCHC },
    { id: "mpv", name: "MPV", onClick: openMPV },
    { id: "mxplayer", name: "MX Player", onClick: openMXPlayer },
    { id: "mxplayerpro", name: "MX Player Pro", onClick: openMXPlayerPro },
    { id: "nplayer", name: "nPlayer", onClick: openNPlayer },
    { id: "potplayer", name: "PotPlayer", onClick: openPotplayer },
    { id: "vlc", name: "VLC", onClick: openVlc },
  ];

  type PlayerButton = typeof playerButtons[number];

  const messagesCache: Record<string, Record<string, string>> = {};
  const defaultLocale = 'en-US';

  async function loadMessages(locale: string): Promise<Record<string, string>> {
    if (messagesCache[locale]) return messagesCache[locale];

    const tryLoad = async (l: string): Promise<Record<string, string>> => {
      const res = await fetch(`${localesBase}/${l}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Record<string, string>>;
    };

    try {
      const messages = await tryLoad(locale);
      messagesCache[locale] = messages;
      return messages;
    } catch {
      // fallback: zh-* → zh-CN → en
      if (locale.startsWith('zh') && locale !== 'zh-CN') {
        try {
          const messages = await tryLoad('zh-CN');
          messagesCache[locale] = messages;
          return messages;
        } catch { /* fall through to en */ }
      }
      if (locale !== defaultLocale) {
        const fallback = await loadMessages(defaultLocale);
        messagesCache[locale] = fallback;
        return fallback;
      }
      return {};
    }
  }

  function PluginIntlProvider({ children }: { children: React.ReactNode }) {
    const config = useConfiguration();
    const language: string | undefined =
      config.data?.configuration?.interface?.language;
    const locale = language || defaultLocale;

    const [messages, setMessages] = React.useState<Record<string, string>>(
      () => messagesCache[locale] ?? {}
    );

    React.useEffect(() => {
      let cancelled = false;
      loadMessages(locale).then(msgs => {
        if (!cancelled) setMessages(msgs);
      });
      return () => { cancelled = true; };
    }, [locale]);

    return React.createElement(
      IntlProvider,
      { locale, messages, defaultLocale: defaultLocale },
      children
    );
  }

  interface SettingsState {
    /** List of excluded (deselected) player IDs; players not in this list are checked by default */
    excludedPlayerIds: string[];
    singlePlayerId: string;
    singlePlayerMode: boolean;
  }

  const defaultSettings: SettingsState = {
    excludedPlayerIds: [],
    singlePlayerId: playerButtons[0].id,
    singlePlayerMode: false,
  };

  function cloneSettings(settings: SettingsState): SettingsState {
    return {
      excludedPlayerIds: [...settings.excludedPlayerIds],
      singlePlayerId: settings.singlePlayerId,
      singlePlayerMode: settings.singlePlayerMode,
    };
  }

  function normalizeSettings(parsed?: Partial<SettingsState>): SettingsState {
    const validIds = playerButtons.map((button) => button.id);
    const excludedPlayerIds = Array.isArray(parsed?.excludedPlayerIds)
      ? parsed.excludedPlayerIds.filter((id): id is string => validIds.includes(id))
      : [];

    const singlePlayerId = validIds.includes(parsed?.singlePlayerId || "")
      ? parsed!.singlePlayerId!
      : playerButtons[0].id;

    return {
      excludedPlayerIds,
      singlePlayerId,
      singlePlayerMode: Boolean(parsed?.singlePlayerMode),
    };
  }

  function readSettings(): SettingsState {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return cloneSettings(defaultSettings);

      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return normalizeSettings(parsed);
    } catch {
      return cloneSettings(defaultSettings);
    }
  }

  function saveSettings(nextSettings: SettingsState) {
    const normalizedSettings = normalizeSettings(nextSettings);
    localStorage.setItem(storageKey, JSON.stringify(normalizedSettings));
    window.dispatchEvent(new CustomEvent("external-player-support-settings-change", { detail: normalizedSettings }));
  }

  function useSettingsState() {
    const [settings, setSettings] = React.useState<SettingsState>(() => readSettings());

    React.useEffect(() => {
      const syncSettings = () => setSettings(readSettings());
      window.addEventListener("storage", syncSettings);
      window.addEventListener("external-player-support-settings-change", syncSettings as EventListener);
      return () => {
        window.removeEventListener("storage", syncSettings);
        window.removeEventListener("external-player-support-settings-change", syncSettings as EventListener);
      };
    }, []);

    return { settings };
  }

  function filterPlayerButtons(settings: SettingsState): PlayerButton[] {
    if (settings.singlePlayerMode) {
      const player = playerButtons.find((button) => button.id === settings.singlePlayerId);
      return player ? [player] : [];
    }

    // excludedPlayerIds stores excluded player IDs; players not in the list are visible
    return playerButtons.filter((button) => !settings.excludedPlayerIds.includes(button.id));
  }

  function getSinglePlayerButton(settings: SettingsState): PlayerButton {
    return filterPlayerButtons(settings)[0] || playerButtons[0];
  }

  const OS = {
    isAndroid: (): boolean => /android/i.test(navigator.userAgent),
    isIOS: (): boolean => /iPad|iPhone|iPod/i.test(navigator.userAgent),
    isMacOS: (): boolean => /Macintosh|MacIntel/i.test(navigator.userAgent),
    isApple: (): boolean => OS.isMacOS() || OS.isIOS(),
    isWindows: (): boolean => /compatible|Windows/i.test(navigator.userAgent),
    isMobile: (): boolean => OS.isAndroid() || OS.isIOS(),
    isUbuntu: (): boolean => /Ubuntu/i.test(navigator.userAgent),
    isLinux: (): boolean => /Linux/i.test(navigator.userAgent),
    isOthers: (): boolean => Object.entries(OS).filter(([key, val]) => key !== 'isOthers').every(([key, val]) => !val()),
  };

  async function writeClipboard(text: string): Promise<boolean> {
    let flag = false;
    if (navigator.clipboard) {
      // Firefox needs https
      try {
        await navigator.clipboard.writeText(text);
        flag = true;
        console.log("Successfully used navigator.clipboard modern clipboard implementation");
      } catch (error) {
        console.error('Error occurred when copying to clipboard using navigator.clipboard:', error);
      }
    } else {
      flag = writeClipboardLegacy(text);
      console.log("navigator.clipboard modern clipboard implementation not available, using legacy implementation");
    }
    return flag;
  }

  function writeClipboardLegacy(text: string): boolean {
    let textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.style.position = 'absolute';
    textarea.style.clip = 'rect(0 0 0 0)';
    textarea.value = text;
    textarea.select();
    if (document.execCommand('copy', true)) {
      return true;
    }
    return false;
  }

  interface SceneInfo {
    title: string;
    streamUrl: string;
    captionUrl: string;
    position: number;
    props: any;
  }

  function getSceneInfo(props: any): SceneInfo {
    let title = props.scene.title;
    const streamUrl = props.scene.paths.stream;
    const captionUrl = props.scene.paths.caption;
    const position = parseInt(props.scene.resume_time) || 0;

    if (!title) {
      const path = props.scene.files?.[0]?.path;
      if (path) {
        title = path.split(/[\\/]/).pop();
      }
    }

    return { title, streamUrl, captionUrl, position, props };
  }

  function getSeek(seconds: number): string {
    const totalMs = Math.round(seconds * 1000);

    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(secs).padStart(2, '0')}.` +
      `${String(ms).padStart(3, '0')}`;
  }

  function urlSafeBase64Encode(input: string): string {
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(new TextEncoder().encode(input))]))
      .replace(/\//g, "_").replace(/\+/g, "-").replace(/\=/g, "");
  }

  // https://github.com/iina/iina/issues/1991
  function openIINA(info: SceneInfo) {
    let iinaUrl = `iina://weblink?url=${encodeURIComponent(info.streamUrl)}&new_window=1`;
    console.log(`iinaUrl= ${iinaUrl}`);
    window.open(iinaUrl, "_self");
  }

  function openInfuse(info: SceneInfo) {
    // sub parameter limitation: Play single video file with external subtitles (Infuse 7.6.2 and above)
    // see: https://support.firecore.com/hc/zh-cn/articles/215090997
    let infuseUrl = `infuse://x-callback-url/play?url=${encodeURIComponent(info.streamUrl)}&sub=${encodeURIComponent(info.captionUrl)}`;
    console.log(`infuseUrl= ${infuseUrl}`);
    window.open(infuseUrl, "_self");
  }

  function openMPCHC(info: SceneInfo) {
    let mpchcUrl = `mpc-hc://${info.streamUrl}`;
    console.log(`mpchcUrl= ${mpchcUrl}`);
    window.open(mpchcUrl, "_self");
  }

  function openMPV(info: SceneInfo) {
    // Desktop requires additional setup, refer to this project: https://github.com/akiirui/mpv-handler
    const streamUrl64 = urlSafeBase64Encode(info.streamUrl);
    const subUrl64 = urlSafeBase64Encode(info.captionUrl);
    const title64 = urlSafeBase64Encode(info.title);
    let MPVUrl = `mpv-handler://play/${streamUrl64}/?subfile=${subUrl64}&v_title=${title64}&startat=${info.position}`;

    if (OS.isIOS()) {
      MPVUrl = `mpv://${encodeURI(info.streamUrl)}`;
    }
    if (OS.isMacOS()) {
      MPVUrl = `mpvplay://${encodeURI(info.streamUrl)}`;
    }
    if (OS.isAndroid()) {
      // https://mpv-android.github.io/mpv-android/intent.html
      const [scheme, streamBody] = info.streamUrl.split(/:\/\//, 2);
      const positionMs = info.position * 1000;
      MPVUrl = `intent://${encodeURI(streamBody)}#Intent;` +
        `scheme=${scheme};` +
        `package=is.xyz.mpv;` +
        `action=android.intent.action.VIEW;` +
        `type=video/any;` +
        `S.title=${encodeURI(info.title)};` +
        `S.subs=${encodeURI(info.captionUrl)};` +
        `i.position=${positionMs};` +
        `end`;
    }
    
    console.log('MPVUrl=', MPVUrl);
    window.open(MPVUrl, "_self");
  }

  function openMXPlayer(info: SceneInfo) {
    handleMXPlayer(info, false);
  }

  function openMXPlayerPro(info: SceneInfo) {
    handleMXPlayer(info, true);
  }

  // https://sites.google.com/site/mxvpen/api
  // https://mx.j2inter.com/api
  // https://support.mxplayer.in/support/solutions/folders/43000574903
  function handleMXPlayer(info: SceneInfo, isPro: boolean) {
    const packageName = isPro? "com.mxtech.videoplayer.pro": "com.mxtech.videoplayer.ad";
    const [scheme, streamBody] = info.streamUrl.split(/:\/\//, 2);
    const positionMs = info.position * 1000;
    const url = `intent://${encodeURI(streamBody)}#Intent;` +
      `scheme=${scheme};` +
      `package=${packageName};` +
      `action=android.intent.action.VIEW;` +
      `type=video/*;` +
      `S.title=${encodeURI(info.title)};` +
      `i.position=${positionMs};` +
      `end`;
    console.log(`mxPlayer url= ${url}`);
    window.open(url, "_self");
  }

  function openNPlayer(info: SceneInfo) {
    let nUrl = OS.isMacOS()
      ? `nplayer-mac://weblink?url=${encodeURIComponent(info.streamUrl)}&new_window=1`
      : `nplayer-${encodeURI(info.streamUrl)}`;
    console.log(`nPlayer url= ${nUrl}`);
    window.open(nUrl, "_self");
  }

  async function openPotplayer(info: SceneInfo) {
    if (!OS.isWindows()) return;
    let potUrl = `potplayer://${encodeURI(info.streamUrl)} /sub=${encodeURI(info.captionUrl)} /seek=${getSeek(info.position)} /title="${info.title}"`;
    await writeClipboard(potUrl);
    console.log("Successfully wrote real deep link to clipboard: ", potUrl);
    // Test shows no spaces also work, potplayer will automatically convert DeepLink to command line arguments, full parameters: PotPlayer About => Command Line Options
    potUrl = `potplayer:///current/clipboard`;
    window.open(potUrl, "_self");
  }

  async function openVlc(info: SceneInfo) {
    // Desktop requires additional setup, refer to this project:
    // new: https://github.com/northsea4/vlc-protocol
    // old: https://github.com/stefansundin/vlc-protocol
    let vlcUrl = `vlc://${info.streamUrl}`;

    if (OS.isAndroid()) {
      // android subtitles:  https://code.videolan.org/videolan/vlc-android/-/issues/1903
      const [scheme, streamBody] = info.streamUrl.split(/:\/\//, 2);
      const positionMs = info.position * 1000;
      vlcUrl = `intent://${encodeURI(streamBody)}#Intent;` +
        `scheme=${scheme};` +
        `package=org.videolan.vlc;` +
        `action=android.intent.action.VIEW;` +
        `type=video/*;` +
        `S.subtitles_location=${encodeURI(info.captionUrl)};` +
        `S.title=${encodeURI(info.title)};` +
        `i.position=${positionMs};` +
        `end`;
    }
    if (OS.isIOS()) {
      // https://wiki.videolan.org/Documentation:IOS/#x-callback-url
      // https://code.videolan.org/videolan/vlc-ios/-/commit/55e27ed69e2fce7d87c47c9342f8889fda356aa9
      vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(info.streamUrl)}&sub=${encodeURIComponent(info.captionUrl)}`;
    }
    console.log(`vlcUrl= ${vlcUrl}`);
    window.open(vlcUrl, "_self");
  }

  type InjectPosition = 'before' | 'after' | 'appendChild' | 'prependChild';
  type ReactNodePredicate = (node: any) => boolean;

  /**
   * Inject a new element into the React virtual DOM tree
   * @param node - Current recursive React node (initially the result)
   * @param predicate - Condition matching function
   * @param position - Insertion position
   * @param newElement - New React element to inject
   */
  function injectIntoReactTree(
    node: any,
    predicate: ReactNodePredicate,
    position: InjectPosition,
    newElement: React.ReactElement
  ): boolean {
    if (!node || !node.props) return false;

    // If the current node is the target and we are inserting a child element
    if (predicate(node) && (position === 'appendChild' || position === 'prependChild')) {
      const c = node.props.children;
      const arr: any[] = !c ? [] : Array.isArray(c) ? c : [c]; // Normalize to array
      position === 'appendChild' ? arr.push(newElement) : arr.unshift(newElement);
      node.props.children = arr;
      return true;
    }

    let children = node.props.children;
    if (!children) return false;

    // If a single child node matches the target, coerce it to an array for uniform processing
    if (!Array.isArray(children) && predicate(children)) {
      children = node.props.children = [children];
    }

    // Traverse and recurse
    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        if (!children[i]) continue;

        if (predicate(children[i])) {
          if (position === 'before') {
            children.splice(i, 0, newElement);
            return true;
          }
          if (position === 'after') {
            children.splice(i + 1, 0, newElement);
            return true;
          }
          // If inserting a child element, force inject into the target node
          return injectIntoReactTree(children[i], () => true, position, newElement);
        }

        // Continue deeper recursion
        if (injectIntoReactTree(children[i], predicate, position, newElement)) return true;
      }
    } else {
      // Single node didn't match, continue recursing down
      return injectIntoReactTree(children, predicate, position, newElement);
    }

    return false;
  }

  const PortalMenu = React.forwardRef<HTMLDivElement, any>(function PortalMenu(props, ref) {
    return ReactDOM.createPortal(
      <div ref={ref} {...props} />,
      document.body
    );
  });

  function createButtonGroup() {
    return (
      <>
        <hr />
        <ButtonGroup className="card-popovers" />
      </>
    );
  }

  function createPlayIcon(props: React.SVGProps<SVGSVGElement> = {}) {
    return (
      <svg
        fill="currentColor"
        className="bi bi-play-btn-fill"
        viewBox="0 0 16 16"
        {...props}
      >
        <path d="M0 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm6.79-6.907A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z" />
      </svg>
    );
  }

  /** Thin wrapper: provides IntlProvider context for SettingsModalInner */
  function SettingsModal() {
    return (
      <PluginIntlProvider>
        <SettingsModalInner />
      </PluginIntlProvider>
    );
  }

  function SettingsModalInner() {
    const intl = Intl.useIntl();
    const [show, setShow] = React.useState(false);
    const { settings } = useSettingsState();
    const [draftSettings, setDraftSettings] = React.useState<SettingsState>(() => cloneSettings(settings));

    React.useEffect(() => {
      if (!show) {
        setDraftSettings(cloneSettings(settings));
      }
    }, [settings, show]);

    const openModal = () => {
      setDraftSettings(cloneSettings(settings));
      setShow(true);
    };

    const closeModal = () => {
      setDraftSettings(cloneSettings(settings));
      setShow(false);
    };

    const togglePlayer = (playerId: string) => {
      setDraftSettings((current) => {
        if (current.singlePlayerMode) {
          return { ...current, singlePlayerId: playerId };
        }

        // excludedPlayerIds is the exclusion list: check = remove from list, uncheck = add to list
        const deselected = current.excludedPlayerIds.includes(playerId)
          ? current.excludedPlayerIds.filter((id) => id !== playerId)
          : [...current.excludedPlayerIds, playerId];

        // Prevent excluding all players (keep at least one visible)
        if (deselected.length >= playerButtons.length) {
          return current;
        }

        return {
          ...current,
          excludedPlayerIds: deselected,
        };
      });
    };

    const confirmSettings = () => {
      saveSettings(draftSettings);
      setShow(false);
    };

    const resetDraftSettings = () => {
      setDraftSettings(cloneSettings(defaultSettings));
    };

    return (
      <>
        <Button
          variant="primary"
          className="external-player-settings-trigger"
          onClick={openModal}
        >
          <Icon icon={faGear}/>
          <FormattedMessage id="settings.openButton" />
        </Button>

        <Modal
          show={show}
          onHide={closeModal}
          centered
          dialogClassName="external-player-settings-modal"
          contentClassName="external-player-settings-modal-content"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FormattedMessage id="settings.modal.title" />
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="note-block">
              ⚠️<strong><FormattedMessage id="settings.noteBold" /></strong>
              <FormattedMessage id="settings.noteText" />
            </div>

            <div className="external-player-settings-section">
              <Form.Check
                type="switch"
                id="external-player-single-mode"
                label={intl.formatMessage({ id: 'settings.singlePlayerMode' })}
                checked={draftSettings.singlePlayerMode}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setDraftSettings((current) => ({
                    ...current,
                    singlePlayerMode: event.target.checked,
                    singlePlayerId: current.singlePlayerId || playerButtons[0].id,
                    excludedPlayerIds: current.excludedPlayerIds.length ? current.excludedPlayerIds : [...defaultSettings.excludedPlayerIds],
                  }))
                }
              />
              <div className="external-player-settings-hint">
                <FormattedMessage id="settings.singlePlayerModeHint" />
              </div>
            </div>

            <div className="external-player-settings-section">
              <div className="external-player-settings-heading">
                <FormattedMessage id="settings.playerSelection" />
              </div>
              <div className="external-player-settings-list">
                {playerButtons.map((button) => {
                  // excludedPlayerIds is the exclusion list; players not in it are checked
                  const checked = draftSettings.singlePlayerMode
                    ? draftSettings.singlePlayerId === button.id
                    : !draftSettings.excludedPlayerIds.includes(button.id);

                  return (
                    <Form.Check
                      key={button.id}
                      type={draftSettings.singlePlayerMode ? "radio" : "checkbox"}
                      id={`external-player-${button.id}`}
                      name="external-player-selection"
                      className="external-player-settings-item"
                      checked={checked}
                      onChange={() => togglePlayer(button.id)}
                      label={
                        <span className="external-player-settings-label">
                          <img
                            src={`${iconsPath}/${button.id}.webp`}
                            alt={button.name}
                            style={{ height: "1.4em", width: "1.4em" }}
                          />
                          <span>{button.name}</span>
                        </span>
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="external-player-settings-section">
              <Button variant="danger" onClick={resetDraftSettings}>
                <FormattedMessage id="settings.reset" />
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              <FormattedMessage id="settings.cancel" />
            </Button>
            <Button variant="primary" onClick={confirmSettings}>
              <FormattedMessage id="settings.confirm" />
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  function ExternalPlayerButtonList({ sceneProps }: { sceneProps: any }) {
    const { settings } = useSettingsState();
    const visiblePlayerButtons = filterPlayerButtons(settings);

    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {visiblePlayerButtons.map(btn =>
          <Button
            key={btn.id}
            variant="secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            onClick={() => btn.onClick(getSceneInfo(sceneProps))}
          >
            <img
              src={`${iconsPath}/${btn.id}.webp`}
              alt={btn.name}
              style={{ height: "1.4em", width: "1.4em" }}
            />
            {btn.name}
          </Button>
        )}
      </div>
    );
  }

  function SceneCardExternalPlayerControls({ sceneProps }: { sceneProps: any }) {
    const { settings } = useSettingsState();
    const [isOpen, setIsOpen] = React.useState(false);

    if (settings.singlePlayerMode) {
      const player = getSinglePlayerButton(settings);

      return (
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip id={`external-player-tooltip-${player.id}`}>{player.name}</Tooltip>}
        >
          <div>
            <Button
              className="minimal"
              variant="link"
              onClick={() => player.onClick(getSceneInfo(sceneProps))}
            >
              <img
                src={`${iconsPath}/${player.id}.webp`}
                alt={player.name}
                style={{ height: "1.4em", width: "1.4em", verticalAlign: "-0.3em"  }}
              />
            </Button>
          </div>
        </OverlayTrigger>
      );
    }

    const visiblePlayerButtons = filterPlayerButtons(settings);

    return (
      <Dropdown
        className="d-inline-block"
        show={isOpen}
        onToggle={(nextShow: boolean) => setIsOpen(nextShow)}
      >
        <Dropdown.Toggle
          className="minimal"
          // variant="link"
        >
          {createPlayIcon({ style: { height: "1.25em", width: "1.25em", verticalAlign: "-0.3em" } })}
        </Dropdown.Toggle>

        {isOpen && (
          <Dropdown.Menu as={PortalMenu}>
            {visiblePlayerButtons.map(btn =>
              <Dropdown.Item
                key={btn.id}
                onClick={() => btn.onClick(getSceneInfo(sceneProps))}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <img
                  src={`${iconsPath}/${btn.id}.webp`}
                  alt={btn.name}
                  style={{ height: "1.4em", width: "1.4em" }}
                />
                {btn.name}
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        )}
      </Dropdown>
    );
  }

  function ExternalPlayerTabLabel() {
    return (
      <Nav.Item key="external-player-tab-nav">
        <Nav.Link eventKey="external-player-tab">
          <PluginIntlProvider>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {createPlayIcon({ style: { height: "1.25em", width: "1.25em" } })}
              <FormattedMessage id='tab.label' />
            </div>
          </PluginIntlProvider>
        </Nav.Link>
      </Nav.Item>
    );
  }

  function ExternalPlayerTabHeader({ sceneProps }: { sceneProps: any }) {
    return (
      <Tab.Pane
        key="external-player-tab-content"
        eventKey="external-player-tab"
      >
        <div className="external-player-tab-header">
          <PluginIntlProvider>
            <h5><FormattedMessage id='tab.header' /></h5>
          </PluginIntlProvider>
          <SettingsModal />
        </div>
        <ExternalPlayerButtonList sceneProps={sceneProps} />
      </Tab.Pane>
    );
  }

  // Patch the ScenePage to add a new tab for external player support
  PluginApi.patch.after(
    "ScenePage.Tabs",
    function (props: any, _: any, original: any) {

      original.props.children.push(
        <ExternalPlayerTabLabel />
      );

      return original;
    }
  );

  // Patch the ScenePage.TabContent to add buttons for open external player
  PluginApi.patch.after(
    "ScenePage.TabContent",
    function (props: any, _: any, original: any) {

      original.props.children.push(
        <ExternalPlayerTabHeader sceneProps={props} />
      );

      return original;
    }
  );

  // Patch the Scene Card to add buttons for external players
  PluginApi.patch.after(
    "SceneCard.Popovers",
    function (props: any, _: any, original: any) {
      // console.log("ID:", props.scene.id, " Title:", props.scene.title, " result:", result);
      if (!original.props.children) {
        original.props.children = createButtonGroup();
      }

      injectIntoReactTree(
        original,
        (node) => node?.type instanceof Object && node.type?.displayName === "ButtonGroup",
        "appendChild",
        <SceneCardExternalPlayerControls key="external-player-controls" sceneProps={props} />
      );

      return original;
    }
  );

  // Add a settings button at this plugin's location under Settings -> Plugins
  PluginApi.patch.after(
    "SettingGroup",
    function (props: any, _: any, original: any) {
      // console.log("props:", props, " result:", result);
      if (Array.isArray(props?.children)) {
        if (props.children?.[1]?.props?.pluginID === pluginID) {
          injectIntoReactTree(
            props.topLevel,
            (node) => node?.type instanceof Object && node.type?.displayName === "Button",
            "before",
            <SettingsModal />
          );
        }
      }

      return original;
    }
  );

})();
